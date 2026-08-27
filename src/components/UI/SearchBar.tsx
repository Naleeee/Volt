import { Search } from "lucide-react-native";
import { TextInput, View, type TextInputProps } from "react-native";
import { colors } from "@/constants/theme";

export default function SearchBar(props: TextInputProps) {
  return (
    <View className="flex-row items-center gap-2 bg-card2 border border-line rounded-full h-12 px-4">
      <Search size={18} color={colors.muted} />
      <TextInput
        className="flex-1 h-full py-0 font-archivo text-base text-text placeholder:text-muted"
        style={{ includeFontPadding: false }}
        textAlignVertical="center"
        placeholderTextColor={colors.muted}
        autoCorrect={false}
        returnKeyType="search"
        {...props}
      />
    </View>
  );
}
