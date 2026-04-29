import * as React from "react";
import TextField from "@mui/material/TextField";
import type { TextFieldProps } from "@mui/material/TextField";
import { IMaskInput } from "react-imask";

type PhoneMaskInputProps = {
  name: string;
  onChange: (event: { target: { name: string; value: string } }) => void;
};

const normalizePhoneChunk = (chunk: string): string => {
  const digits = chunk.replace(/\D/g, "");

  if (
    digits.length >= 11 &&
    (digits.startsWith("7") || digits.startsWith("8"))
  ) {
    return digits.slice(1, 11);
  }

  if (digits.length > 10) {
    return digits.slice(0, 10);
  }

  return chunk;
};

const PhoneMaskInput = React.forwardRef<HTMLInputElement, PhoneMaskInputProps>(
  function PhoneMaskInput(props, ref) {
    const { onChange, ...other } = props;
    return (
      <IMaskInput
        {...other}
        inputRef={ref}
        mask="+{7} (000) 000-00-00"
        definitions={{ "0": /[0-9]/ }}
        overwrite
        lazy={false}
        prepare={(value: string) => normalizePhoneChunk(value)}
        onAccept={(value: string) => {
          onChange({ target: { name: props.name, value } });
        }}
      />
    );
  },
);

export type PhoneFieldProps = Omit<
  TextFieldProps,
  "onChange" | "defaultValue"
> & {
  name: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  inputRef?: React.Ref<HTMLInputElement>;
};

export function PhoneField({
  name,
  value,
  onChange,
  onBlur,
  inputRef,
  ...textFieldProps
}: PhoneFieldProps) {
  return (
    <TextField
      {...textFieldProps}
      name={name}
      value={value}
      onBlur={onBlur}
      fullWidth
      InputProps={{
        inputComponent: PhoneMaskInput as never,
        inputProps: {
          name,
          onChange: (e: { target: { name: string; value: string } }) =>
            onChange(e.target.value),
        },
        inputRef,
      }}
    />
  );
}
