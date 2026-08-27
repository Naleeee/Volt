import { TextInput, View, type TextInputProps } from "react-native";
import FieldLabel from "./FieldLabel";

type Props = TextInputProps & {
  label?: string;
  optional?: boolean;
};

export default function VTextInput({ label, optional, ...props }: Props) {
  return (
    <View className="w-full">
      {label ? <FieldLabel label={label} optional={optional} /> : null}
      <TextInput
        textAlignVertical={props.multiline ? "top" : "center"}
        className={
          props.multiline
            ? "bg-card2 border border-line rounded-2xl min-h-[92px] px-4 py-4 font-archivo text-sm leading-5 text-text placeholder:text-muted"
            : "bg-card2 border border-line rounded-2xl h-[52px] px-4 font-archivo-semibold text-base text-text placeholder:text-muted"
        }
        {...props}
      />
    </View>
  );
}
