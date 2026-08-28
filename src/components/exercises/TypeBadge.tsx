import { Text, View } from "react-native";
import { MeasuredBy } from "@/lib/enums";

const STYLES: Record<MeasuredBy, { box: string; text: string }> = {
  [MeasuredBy.Reps]: { box: "border-accent/35", text: "text-accent" },
  [MeasuredBy.Time]: { box: "border-time/35", text: "text-time" },
  [MeasuredBy.Other]: { box: "border-other/35", text: "text-other" },
};

export default function TypeBadge({ measuredBy }: { measuredBy: MeasuredBy }) {
  const style = STYLES[measuredBy];
  return (
    <View className={`self-start border rounded-sm px-1.5 py-1 ${style.box}`}>
      <Text
        className={`font-archivo-bold text-[10px] tracking-widest ${style.text}`}
      >
        {measuredBy.toUpperCase()}
      </Text>
    </View>
  );
}
