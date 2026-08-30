import { Pressable, View } from "react-native";

type Props = {
  value: boolean;
  onChange: (value: boolean) => void;
  accessibilityLabel: string;
};

export default function Toggle({ value, onChange, accessibilityLabel }: Props) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value }}
      hitSlop={8}
      className={`w-[50px] h-[30px] rounded-full justify-center ${value ? "bg-accent items-end" : "bg-white/[0.14] items-start"}`}
    >
      <View
        className={`w-[26px] h-[26px] rounded-full mx-0.5 ${value ? "bg-white" : "bg-muted"}`}
      />
    </Pressable>
  );
}
