from midiutil import MIDIFile

def create_podcast_jingle():
    # Create a MIDI file
    midi_file = MIDIFile(1)  # only one track
    midi_file.addTrackName(0, 0, "Podcast Jingle")
    midi_file.addTempo(0, 0, 120)  # tempo in BPM

    # Define some notes for the jingle (C4, E4, G4, C5 for a simple melody)
    notes = [60, 64, 67, 72]  # MIDI numbers for C4, E4, G4, C5
    durations = [1, 1, 1, 1]  # each note lasts for 1 beat

    # Add notes to the track
    for i, note in enumerate(notes):
        midi_file.addNote(0, 0, note, i, durations[i], 100)  # channel 0, pitch, time, duration, velocity

    # Save the MIDI file
    with open("podcast_jingle.mid", "wb") as output_file:
        midi_file.writeFile(output_file)

# Create the jingle MIDI file
create_podcast_jingle()
