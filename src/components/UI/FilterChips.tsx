import { Pressable, Text, View } from "react-native";

type Option<T> = { value: T; label: string };

type Props<T extends string> = {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

export default function FilterChips<T extends string>({
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <View className="flex-row gap-2">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            className={`rounded-full px-4 py-2 ${
              selected ? "bg-accent" : "bg-card2 border border-line"
            }`}
          >
            <Text
              className={`font-archivo-bold text-sm ${
                selected ? "text-accent-ink" : "text-muted"
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
