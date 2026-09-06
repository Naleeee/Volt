import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import { getSettings, type Settings } from "@/db/queries/settings";
import { playTimerSound } from "@/lib/sounds";

jest.mock("expo-audio", () => ({
  createAudioPlayer: jest.fn(),
  setAudioModeAsync: jest.fn(() => Promise.resolve()),
}));
jest.mock("@/db/queries/settings", () => ({ getSettings: jest.fn() }));

const settings = (timerSounds: boolean): Settings => ({
  restBetweenSetsSec: 45,
  restBetweenExercisesSec: 90,
  autostartRestTimer: true,
  timerSounds,
  keepAwake: true,
});

const newPlayer = () =>
  ({ seekTo: jest.fn(() => Promise.resolve()), play: jest.fn() }) as unknown as AudioPlayer;

describe("playTimerSound", () => {
  it("stays silent when timer sounds are off", async () => {
    jest.mocked(getSettings).mockResolvedValue(settings(false));
    await playTimerSound("rest");
    expect(createAudioPlayer).not.toHaveBeenCalled();
    expect(setAudioModeAsync).not.toHaveBeenCalled();
  });

  it("configures audio once and reuses one player per sound", async () => {
    jest.mocked(getSettings).mockResolvedValue(settings(true));
    jest.mocked(createAudioPlayer).mockImplementation(newPlayer);

    await playTimerSound("rest");
    await playTimerSound("rest");
    await playTimerSound("time");

    expect(setAudioModeAsync).toHaveBeenCalledTimes(1);
    expect(setAudioModeAsync).toHaveBeenCalledWith(expect.objectContaining({ playsInSilentMode: true }));
    expect(createAudioPlayer).toHaveBeenCalledTimes(2);

    const rest = jest.mocked(createAudioPlayer).mock.results[0].value as AudioPlayer;
    expect(rest.seekTo).toHaveBeenCalledTimes(2);
    expect(rest.seekTo).toHaveBeenCalledWith(0);
    expect(rest.play).toHaveBeenCalledTimes(2);
  });
});
