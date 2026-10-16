#include <JuceHeader.h>
class DeckProcessor final : public juce::AudioProcessor {
public:
 DeckProcessor() : juce::AudioProcessor(BusesProperties().withOutput("Output",juce::AudioChannelSet::stereo(),true)) {}
 const juce::String getName() const override {return "APP DECK";}
 void prepareToPlay(double, int) override {}
 void releaseResources() override {}
 bool isBusesLayoutSupported(const BusesLayout& l) const override {return l.getMainOutputChannelSet()==juce::AudioChannelSet::stereo();}
 void processBlock(juce::AudioBuffer<float>& b, juce::MidiBuffer&) override {b.clear();}
 juce::AudioProcessorEditor* createEditor() override;
 bool hasEditor() const override {return true;}
 double getTailLengthSeconds() const override {return 0;}
 bool acceptsMidi() const override {return true;}
 bool producesMidi() const override {return false;}
 bool isMidiEffect() const override {return false;}
 int getNumPrograms() override {return 1;}
 int getCurrentProgram() override {return 0;}
 void setCurrentProgram(int) override {}
 const juce::String getProgramName(int) override {return {};}
 void changeProgramName(int,const juce::String&) override {}
 void getStateInformation(juce::MemoryBlock& d) override {juce::MemoryOutputStream s(d,false);s.writeString("APPDECK_01");}
 void setStateInformation(const void*,int) override {}
};
class DeckEditor final : public juce::AudioProcessorEditor {
public:
 explicit DeckEditor(DeckProcessor& p):juce::AudioProcessorEditor(p) {setSize(760,470);}
 void paint(juce::Graphics& g) override {
  g.fillAll(juce::Colour::fromRGB(225,238,246));
  g.setColour(juce::Colours::white.withAlpha(0.67f));
  g.fillRoundedRectangle(25,25,710,420,22);
  g.setColour(juce::Colour::fromRGB(56,87,110));
  g.setFont(juce::FontOptions(28.0f));g.drawText("APP DECK",54,53,500,45,juce::Justification::centredLeft);
  g.setFont(juce::FontOptions(14.0f));g.drawText("MODULAR AUDIO WORKSPACE  /  V0.1",56,101,540,25,juce::Justification::centredLeft);
  g.setColour(juce::Colour::fromRGB(194,220,238));
  g.fillRoundedRectangle(54,155,310,220,18);
  g.setColour(juce::Colour::fromRGB(222,215,240));
  g.fillRoundedRectangle(388,155,310,220,18);
  g.setColour(juce::Colour::fromRGB(56,87,110));
  g.setFont(juce::FontOptions(21.0f));
  g.drawText("Sample Playground",75,230,270,40,juce::Justification::centred);
  g.drawText("LUXURY 1912",405,230,275,40,juce::Justification::centred);
  g.setFont(juce::FontOptions(12.0f));
  g.drawText("UI SHELL / AUDIO ENGINE NEXT",70,320,290,30,juce::Justification::centred);
  g.drawText("FUTURE MODULE",410,320,270,30,juce::Justification::centred);
 }
};
juce::AudioProcessorEditor* DeckProcessor::createEditor(){return new DeckEditor(*this);}
juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter(){return new DeckProcessor();}
