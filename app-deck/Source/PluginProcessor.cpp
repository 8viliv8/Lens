#include <JuceHeader.h>
#include <array>
#include <memory>
class DeckProcessor final : public juce::AudioProcessor {
public:
 static constexpr int count=8;
 struct Slot {std::shared_ptr<juce::AudioBuffer<float>> audio;juce::String path;double sampleRate=44100.0;double pos=0;float gain=.7f;bool loop=true,mute=false,playing=false;};
 std::array<Slot,count> slots;
 juce::CriticalSection lock;
 juce::AudioFormatManager formats;
 std::atomic<double> hostTempo{120};
 bool wasHostPlaying=false;
 DeckProcessor():juce::AudioProcessor(BusesProperties().withOutput("Output",juce::AudioChannelSet::stereo(),true)){formats.registerBasicFormats();}
 const juce::String getName() const override{return "APP DECK";}
 void prepareToPlay(double,int) override{}
 void releaseResources() override{}
 bool isBusesLayoutSupported(const BusesLayout& b)const override{return b.getMainOutputChannelSet()==juce::AudioChannelSet::stereo();}
 bool load(int i,juce::File file){
  if(!juce::isPositiveAndBelow(i,count))return false;
  std::unique_ptr<juce::AudioFormatReader> r(formats.createReaderFor(file));
  if(!r||r->lengthInSamples<=0||r->lengthInSamples>20000000||r->numChannels==0)return false;
  auto b=std::make_shared<juce::AudioBuffer<float>>(juce::jlimit(1,2,(int)r->numChannels),(int)r->lengthInSamples);
  if(!r->read(b.get(),0,b->getNumSamples(),0,true,true))return false;
  const juce::ScopedLock g(lock);auto& s=slots[(size_t)i];s.audio=b;s.path=file.getFullPathName();s.sampleRate=r->sampleRate;s.pos=0;s.playing=false;return true;
 }
 void trigger(int i){const juce::ScopedLock g(lock);auto& s=slots[(size_t)i];s.pos=0;s.playing=true;}
 void processBlock(juce::AudioBuffer<float>& out,juce::MidiBuffer& midi)override{
  juce::ScopedNoDenormals no;out.clear();
  if(getSampleRate()<=0)return;
  bool hostPlaying=false;double bpm=120,ppq=0;
  if(auto* h=getPlayHead())if(auto p=h->getPosition()){hostPlaying=p->getIsPlaying();bpm=p->getBpm().orFallback(120.0);ppq=p->getPpqPosition().orFallback(0.0);}
  hostTempo.store(bpm);
  const juce::ScopedTryLock g(lock);if(!g.isLocked())return;
  for(const auto meta:midi){auto m=meta.getMessage();if(m.isNoteOn()){int i=m.getNoteNumber()%count;auto& s=slots[(size_t)i];if(!s.loop){s.pos=0;s.playing=true;}}}
  for(int n=0;n<out.getNumSamples();++n){
   double beat=ppq+n*bpm/(60.0*getSampleRate());
   bool barStart=hostPlaying&&((n==0&&!wasHostPlaying)||std::floor(beat/4.0)>std::floor((beat-bpm/(60.0*getSampleRate()))/4.0));
   for(auto& s:slots){
    if(!s.audio)continue;
    if(s.loop){if(!hostPlaying)continue;if(barStart){s.pos=0;s.playing=true;}}
    if(!s.playing)continue;
    int idx=(int)s.pos;
    if(idx>=s.audio->getNumSamples()){if(s.loop){s.pos=0;idx=0;}else{s.playing=false;continue;}}
    if(!s.mute){out.addSample(0,n,s.audio->getSample(0,idx)*s.gain);out.addSample(1,n,s.audio->getSample(s.audio->getNumChannels()>1?1:0,idx)*s.gain);}
    s.pos+=s.sampleRate/getSampleRate();
   }
  }
  wasHostPlaying=hostPlaying;
 }
 juce::AudioProcessorEditor* createEditor()override;
 bool hasEditor()const override{return true;}
 double getTailLengthSeconds()const override{return 0;}
 bool acceptsMidi()const override{return true;}
 bool producesMidi()const override{return false;}
 bool isMidiEffect()const override{return false;}
 int getNumPrograms()override{return 1;}
 int getCurrentProgram()override{return 0;}
 void setCurrentProgram(int)override{}
 const juce::String getProgramName(int)override{return {};}
 void changeProgramName(int,const juce::String&)override{}
 void getStateInformation(juce::MemoryBlock& data)override{juce::XmlElement xml("APPDECK");const juce::ScopedLock g(lock);for(int i=0;i<count;++i){auto* e=xml.createNewChildElement("slot");e->setAttribute("index",i);e->setAttribute("path",slots[(size_t)i].path);e->setAttribute("loop",slots[(size_t)i].loop);e->setAttribute("gain",(double)slots[(size_t)i].gain);}copyXmlToBinary(xml,data);}
 void setStateInformation(const void* d,int sz)override{auto xml=getXmlFromBinary(d,sz);if(!xml)return;for(auto* e:xml->getChildIterator()){int i=e->getIntAttribute("index",-1);if(!juce::isPositiveAndBelow(i,count))continue;auto p=e->getStringAttribute("path");if(p.isNotEmpty())load(i,juce::File(p));const juce::ScopedLock g(lock);slots[(size_t)i].loop=e->getBoolAttribute("loop",true);slots[(size_t)i].gain=(float)e->getDoubleAttribute("gain",.7);}}
};
class DeckEditor final:public juce::AudioProcessorEditor{
 DeckProcessor& p;
 juce::TextButton home{"HOME"},load{"LOAD WAV / MP3"},play{"TRIGGER"},mode{"LOOP / SHOT"};
 juce::ComboBox channel;
 juce::Label status;
public:
 explicit DeckEditor(DeckProcessor& proc):juce::AudioProcessorEditor(proc),p(proc){
  setSize(790,500);
  for(int i=0;i<DeckProcessor::count;++i)channel.addItem("CHANNEL "+juce::String(i+1),i+1);
  channel.setSelectedId(1);addAndMakeVisible(channel);
  for(auto* b:{&home,&load,&play,&mode})addAndMakeVisible(*b);
  addAndMakeVisible(status);status.setText("Sample Playground  /  Select a channel and load a sample",juce::dontSendNotification);
  load.onClick=[this]{auto* editor=this;auto chooser=std::make_shared<juce::FileChooser>("Choose sample",juce::File{},"*.wav;*.aiff;*.mp3");chooser->launchAsync(juce::FileBrowserComponent::openMode|juce::FileBrowserComponent::canSelectFiles,[safe=juce::Component::SafePointer<DeckEditor>(editor),chooser](const juce::FileChooser& c){if(safe==nullptr)return;auto f=c.getResult();if(f.existsAsFile()){bool ok=safe->p.load(safe->channel.getSelectedId()-1,f);safe->status.setText(ok?f.getFileName():"Unable to read file",juce::dontSendNotification);}});};
  play.onClick=[this]{p.trigger(channel.getSelectedId()-1);};
  mode.onClick=[this]{const juce::ScopedLock g(p.lock);auto& s=p.slots[(size_t)(channel.getSelectedId()-1)];s.loop=!s.loop;status.setText(s.loop?"LOOP mode":"SHOT mode",juce::dontSendNotification);};
  home.onClick=[this]{status.setText("APP DECK  /  Sample Playground",juce::dontSendNotification);};
 }
 void paint(juce::Graphics& g)override{
  g.fillAll(juce::Colour::fromRGB(229,240,249));g.setColour(juce::Colours::white.withAlpha(.65f));g.fillRoundedRectangle(getLocalBounds().toFloat().reduced(18),20);
  g.setColour(juce::Colour::fromRGB(55,88,113));g.setFont(juce::FontOptions(30));g.drawText("APP DECK",40,35,540,52,juce::Justification::centredLeft);
  g.setFont(juce::FontOptions(14));g.drawText("GLASS INTERFACE   /   SAMPLE PLAYGROUND",43,95,640,26,juce::Justification::centredLeft);
  g.setColour(juce::Colour::fromRGB(196,220,240));g.fillRoundedRectangle(40,158,710,245,16);
  g.setColour(juce::Colour::fromRGB(55,88,113));g.setFont(juce::FontOptions(16));g.drawText("8 CHANNEL SAMPLE ENGINE",65,178,600,35,juce::Justification::centredLeft);
 }
 void resized()override{home.setBounds(650,50,100,35);channel.setBounds(65,230,165,35);load.setBounds(242,230,170,35);play.setBounds(424,230,120,35);mode.setBounds(556,230,160,35);status.setBounds(65,320,650,35);}
};
juce::AudioProcessorEditor* DeckProcessor::createEditor(){return new DeckEditor(*this);}
juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter(){return new DeckProcessor();}
