import { useState } from "react";
import { Pressable, Text, View, type LayoutChangeEvent } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { colors } from "@/constants/theme";
import FieldLabel from "./FieldLabel";

const BORDER = 1;
const PAD = 4;
const GAP = 4;
const TIMING = { duration: 200, easing: Easing.out(Easing.cubic) };

type Option<T> = { value: T; label: string };

type Props<T extends string> = {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  optional?: boolean;
  legend?: string;
};

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  optional,
  legend,
}: Props<T>) {
  const [width, setWidth] = useState(0);
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const segmentWidth =
    (width - 2 * (BORDER + PAD) - GAP * (options.length - 1)) / options.length;

  const thumbStyle = useAnimatedStyle(() => ({
    width: segmentWidth,
    transform: [
      { translateX: withTiming(index * (segmentWidth + GAP), TIMING) },
    ],
  }));

  return (
    <View className="w-full">
      {label ? <FieldLabel label={label} optional={optional} /> : null}
      <View
        className="flex-row bg-card2 border border-line rounded-2xl p-1 gap-1"
        onLayout={(e: LayoutChangeEvent) =>
          setWidth(e.nativeEvent.layout.width)
        }
      >
        {width > 0 ? (
          <Animated.View
            style={[
              {
                position: "absolute",
                top: PAD,
                bottom: PAD,
                left: PAD,
                borderRadius: 10,
                backgroundColor: colors.card3,
              },
              thumbStyle,
            ]}
          />
        ) : null}
        {options.map((option) => (
          <Segment
            key={option.value}
            label={option.label}
            selected={option.value === value}
            onPress={() => onChange(option.value)}
          />
        ))}
      </View>
      {legend ? (
        <Text className="font-archivo text-xs text-muted mt-2 px-4">
          {legend}
        </Text>
      ) : null}
    </View>
  );
}

function Segment({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const textStyle = useAnimatedStyle(() => ({
    color: withTiming(selected ? colors.accent : colors.muted, TIMING),
  }));

  return (
    <Pressable
      className="flex-1 items-center py-3"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Animated.Text
        style={[{ fontFamily: "Archivo-Bold", fontSize: 14 }, textStyle]}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );
}
