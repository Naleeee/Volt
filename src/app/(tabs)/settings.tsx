import { ChevronRight, Minus, Plus } from "lucide-react-native";
import { Children, type ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toggle from "@/components/UI/Toggle";
import { colors } from "@/constants/theme";
import { restSeconds, setSetting, useSettings } from "@/db/queries/settings";
import { formatClock } from "@/lib/format";
import { toast } from "@/lib/toast";

const REST_STEP_SEC = 15;

type RestKey = "restBetweenSetsSec" | "restBetweenExercisesSec";

const formatRest = (sec: number) => (sec < 120 ? `${sec} s` : formatClock(sec));

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const settings = useSettings();

  const stepRest = (key: RestKey, delta: number) => {
    const next = settings[key] + delta;
    if (restSeconds.safeParse(next).success) void setSetting(key, next);
  };

  return (
    <View
      className="flex-1 bg-bg px-4 gap-4"
      style={{ paddingTop: insets.top }}
    >
      <Text className="font-archivo-black text-4xl text-text">Settings</Text>
      <ScrollView
        contentContainerStyle={{ gap: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Section title="Rest timers">
          <Row label="Between sets" hint="Default; override per exercise">
            <Stepper
              label="Rest between sets"
              value={formatRest(settings.restBetweenSetsSec)}
              onStep={(delta) => stepRest("restBetweenSetsSec", delta)}
            />
          </Row>
          <Row label="Between exercises" hint="When the next exercise starts">
            <Stepper
              label="Rest between exercises"
              value={formatRest(settings.restBetweenExercisesSec)}
              onStep={(delta) => stepRest("restBetweenExercisesSec", delta)}
            />
          </Row>
          <Row label="Auto-start rest" hint="Begin countdown on set logged">
            <Toggle
              value={settings.autostartRestTimer}
              onChange={(v) => void setSetting("autostartRestTimer", v)}
              accessibilityLabel="Auto-start rest"
            />
          </Row>
        </Section>

        <Section title="General">
          <Row
            label="Language"
            onPress={() => toast.info("English only for now")}
          >
            <Text className="font-archivo-semibold text-[15px] text-muted">
              English
            </Text>
            <Chevron />
          </Row>
          <Row label="Timer sounds" hint="Sound when rest or a hold ends">
            <Toggle
              value={settings.timerSounds}
              onChange={(v) => void setSetting("timerSounds", v)}
              accessibilityLabel="Timer sounds"
            />
          </Row>
          <Row label="Keep screen awake" hint="During active sessions">
            <Toggle
              value={settings.keepAwake}
              onChange={(v) => void setSetting("keepAwake", v)}
              accessibilityLabel="Keep screen awake"
            />
          </Row>
        </Section>

        <Section title="Data">
          <Row label="Export history" onPress={() => toast.info("Coming soon")}>
            <Chevron />
          </Row>
          <Row
            label="Erase all data"
            danger
            onPress={() => toast.info("Coming soon")}
          >
            <Chevron />
          </Row>
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View>
      <Text className="font-archivo-bold text-xs tracking-[1.5px] text-muted mb-2 px-1">
        {title.toUpperCase()}
      </Text>
      <View className="bg-card border border-line rounded-[20px] px-4">
        {Children.toArray(children).map((child, i) => (
          <View key={i} className={i > 0 ? "border-t border-line" : ""}>
            {child}
          </View>
        ))}
      </View>
    </View>
  );
}

function Row({
  label,
  hint,
  danger = false,
  onPress,
  children,
}: {
  label: string;
  hint?: string;
  danger?: boolean;
  onPress?: () => void;
  children: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      className="flex-row items-center justify-between gap-3 py-3 active:opacity-80"
    >
      <View className="flex-1">
        <Text
          className={`font-archivo-bold text-base ${danger ? "text-danger" : "text-text"}`}
        >
          {label}
        </Text>
        {hint ? (
          <Text className="font-archivo text-xs text-muted mt-0.5">{hint}</Text>
        ) : null}
      </View>
      {children}
    </Pressable>
  );
}

function Stepper({
  label,
  value,
  onStep,
}: {
  label: string;
  value: string;
  onStep: (delta: number) => void;
}) {
  return (
    <View className="flex-row items-center gap-2">
      <StepButton
        icon={Minus}
        label={`${label}: ${REST_STEP_SEC} s less`}
        onPress={() => onStep(-REST_STEP_SEC)}
      />
      <Text
        className="min-w-[46px] text-center font-archivo-black text-base text-text"
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {value}
      </Text>
      <StepButton
        icon={Plus}
        label={`${label}: ${REST_STEP_SEC} s more`}
        onPress={() => onStep(REST_STEP_SEC)}
      />
    </View>
  );
}

function StepButton({
  icon: Icon,
  label,
  onPress,
}: {
  icon: typeof Minus;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="w-[34px] h-[34px] rounded-full bg-card2 border border-line items-center justify-center active:opacity-80"
    >
      <Icon size={14} strokeWidth={2.4} color={colors.text} />
    </Pressable>
  );
}

function Chevron() {
  return <ChevronRight size={18} color={colors.muted} />;
}
