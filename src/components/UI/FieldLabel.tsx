import { Text } from "react-native";

export default function FieldLabel({
  label,
  optional,
}: {
  label: string;
  optional?: boolean;
}) {
  return (
    <Text className="font-archivo-bold text-sm tracking-widest text-muted mb-2 px-4">
      {label.toUpperCase()}
      {optional ? (
        <Text className="font-archivo-semibold tracking-normal text-muted/60">
          {" · optional"}
        </Text>
      ) : null}
    </Text>
  );
}
