from midiutil import MIDIFile

def create_cool_podcast_jingle():
    # Create a MIDI file
    midi_file = MIDIFile(1)  # only one track
    midi_file.addTrackName(0, 0, "Cool Podcast Jingle")
    midi_file.addTempo(0, 0, 120)  # tempo in BPM

    # Define a more interesting melody with varied notes and rhythms
    notes = [60, 64, 67, 72, 74, 76, 72, 67, 64, 60]  # C4, E4, G4, C5, D5, E5, C5, G4, E4, C4
    durations = [1, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 2]  # varied durations

    # Add notes to the track with some dynamic changes
    for i, note in enumerate(notes):
        midi_file.addNote(0, 0, note, sum(durations[:i]), durations[i], 100)  # channel 0, pitch, time, duration, velocity

    # Save the MIDI file
    with open("cool_podcast_jingle.mid", "wb") as output_file:
        midi_file.writeFile(output_file)

# Create the cooler jingle MIDI file
create_cool_podcast_jingle()
