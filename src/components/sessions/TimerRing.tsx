import type { ReactNode } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0 → empty, 1 → full
  color: string;
  trackColor?: string;
  children?: ReactNode;
};

export default function TimerRing({
  size = 264,
  strokeWidth = 10,
  progress,
  color,
  trackColor = "rgba(255,255,255,0.09)",
  children,
}: Props) {
  const radius = (size - strokeWidth) / 2 - 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, progress));

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: withTiming(circumference * (1 - clamped), {
      duration: 1000,
      easing: Easing.linear,
    }),
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg
        width={size}
        height={size}
        style={{ transform: [{ rotate: "-90deg" }] }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference}`}
          animatedProps={animatedProps}
        />
      </Svg>
      <View className="absolute inset-0 items-center justify-center">
        {children}
      </View>
    </View>
  );
}
