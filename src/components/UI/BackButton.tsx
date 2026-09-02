import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Pressable } from "react-native";
import { colors } from "@/constants/theme";

export default function BackButton({ label = "Back" }: { label?: string }) {
  return (
    <Pressable
      onPress={() => router.back()}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="w-10 h-10 rounded-full bg-card2 border border-line items-center justify-center active:opacity-80"
    >
      <ChevronLeft size={20} color={colors.text} />
    </Pressable>
  );
}
