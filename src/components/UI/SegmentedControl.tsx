import { useEffect, useState } from "react";
import { Pressable, Text, View, type LayoutChangeEvent } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
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
  error?: string;
};

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  optional,
  legend,
  error,
}: Props<T>) {
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const [trackWidth, setTrackWidth] = useState(0);
  const segmentWidth =
    trackWidth > 0
      ? (trackWidth - 2 * (BORDER + PAD) - GAP * (options.length - 1)) /
        options.length
      : 0;
  const position = useSharedValue(index);

  // Syncs the thumb with the controlled value (taps and programmatic changes alike).
  useEffect(() => {
    position.value = withTiming(index, TIMING);
  }, [index, position]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: position.value * (segmentWidth + GAP) }],
  }));

  return (
    <View className="w-full">
      {label ? <FieldLabel label={label} optional={optional} /> : null}
      <View
        className={`flex-row bg-card2 border ${error ? "border-danger" : "border-line"} rounded-2xl p-1 gap-1`}
        onLayout={(e: LayoutChangeEvent) =>
          setTrackWidth(e.nativeEvent.layout.width)
        }
      >
        <Animated.View
          style={[
            {
              position: "absolute",
              top: PAD,
              bottom: PAD,
              left: PAD,
              width: segmentWidth,
              borderRadius: 10,
              backgroundColor: colors.card3,
            },
            thumbStyle,
          ]}
        />
        {options.map((option) => (
          <Segment
            key={option.value}
            label={option.label}
            selected={option.value === value}
            onPress={() => onChange(option.value)}
          />
        ))}
      </View>
      {error ? (
        <Text className="font-archivo text-xs text-danger mt-2 px-4">
          {error}
        </Text>
      ) : legend ? (
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
