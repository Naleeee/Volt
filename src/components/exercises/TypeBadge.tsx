import { Text, View } from "react-native";
import { MeasuredBy } from "@/lib/enums";
import { MEASURED_BY_STYLES } from "@/constants/exercises";

export default function TypeBadge({ measuredBy }: { measuredBy: MeasuredBy }) {
  const style = MEASURED_BY_STYLES[measuredBy];
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
