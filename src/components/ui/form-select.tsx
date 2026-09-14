"use client";

import * as React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EMPTY_VALUE = "__form-select-empty__";

type FormSelectProps = {
  "aria-describedby"?: string;
  "aria-invalid"?: React.AriaAttributes["aria-invalid"];
  "aria-label"?: string;
  "aria-labelledby"?: string;
  children?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  defaultValue?: string | number;
  disabled?: boolean;
  id?: string;
  name?: string;
  onBlur?: React.FocusEventHandler<HTMLSelectElement>;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  required?: boolean;
  title?: string;
  value?: string | number;
};

type OptionProps = React.ComponentProps<"option">;

const toRadixValue = (value: string | number | undefined) =>
  value === "" ? EMPTY_VALUE : value === undefined ? undefined : String(value);

const getOptions = (children: React.ReactNode) =>
  React.Children.toArray(children).flatMap((child) => {
    if (!React.isValidElement<OptionProps>(child) || child.type !== "option") {
      return [];
    }

    const value = child.props.value ?? child.props.children;
    if (typeof value !== "string" && typeof value !== "number") return [];

    return [{
      disabled: child.props.disabled,
      key: child.key ?? String(value),
      label: child.props.children,
      value: toRadixValue(value) ?? EMPTY_VALUE,
    }];
  });

function FormSelect({
  children,
  className,
  contentClassName,
  defaultValue,
  disabled,
  id,
  name,
  onBlur,
  onChange,
  required,
  value,
  ...ariaProps
}: FormSelectProps) {
  const options = getOptions(children);
  const placeholder = options.find(
    (option) => option.value === EMPTY_VALUE && option.disabled,
  );

  const handleValueChange = (nextValue: string) => {
    const resolvedValue = nextValue === EMPTY_VALUE ? "" : nextValue;
    const target = { name: name ?? "", value: resolvedValue } as HTMLSelectElement;
    onChange?.({ target, currentTarget: target } as React.ChangeEvent<HTMLSelectElement>);
  };

  return (
    <Select
      defaultValue={toRadixValue(defaultValue)}
      disabled={disabled}
      name={name}
      onValueChange={handleValueChange}
      required={required}
      value={toRadixValue(value)}
    >
      <SelectTrigger
        {...ariaProps}
        id={id}
        className={className}
        onBlur={(event) =>
          onBlur?.(event as unknown as React.FocusEvent<HTMLSelectElement>)
        }
      >
        <SelectValue placeholder={placeholder?.label} />
      </SelectTrigger>
      <SelectContent className={contentClassName} position="popper">
        {options.map((option) =>
          option.value === EMPTY_VALUE && option.disabled ? null : (
            <SelectItem
              key={option.key}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ),
        )}
      </SelectContent>
    </Select>
  );
}

export { FormSelect };
