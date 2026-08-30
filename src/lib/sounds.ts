import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from "expo-audio";
import { getSettings } from "@/db/queries/settings";

const SOURCES = {
  rest: require("../../assets/sounds/RestFinishedSound.mp3"),
  time: require("../../assets/sounds/TimeFinishedSound.mp3"),
};

const players: Partial<Record<keyof typeof SOURCES, AudioPlayer>> = {};
let audioMode: Promise<void> | undefined;

export async function playTimerSound(kind: keyof typeof SOURCES) {
  if (!(await getSettings()).timerSounds) return;
  audioMode ??= setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: "mixWithOthers",
  });
  await audioMode;
  const player = (players[kind] ??= createAudioPlayer(SOURCES[kind]));
  await player.seekTo(0);
  player.play();
}
