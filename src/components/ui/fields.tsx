import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';
import { IconButton } from './actions';

type FieldMetaProps = {
  label: string;
  helperText?: string;
  error?: string;
  optional?: boolean;
  id?: string;
};

type FieldFrameProps = FieldMetaProps & {
  children: (ids: {
    controlId: string;
    messageId: string | undefined;
  }) => ReactNode;
};

function FieldFrame({
  children,
  error,
  helperText,
  id,
  label,
  optional,
}: FieldFrameProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const message = error ?? helperText;
  const messageId = message ? `${controlId}-message` : undefined;

  return (
    <div className={`field ${error ? 'field--error' : ''}`}>
      <div className="field__label-row">
        <label className="text-label" htmlFor={controlId}>
          {label}
        </label>
        {optional ? <span className="field__optional">Opcional</span> : null}
      </div>
      {children({ controlId, messageId })}
      {message ? (
        <span className="field__message" id={messageId}>
          {message}
        </span>
      ) : null}
    </div>
  );
}

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> &
  FieldMetaProps;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = '', error, helperText, id, label, optional, ...props },
  ref,
) {
  return (
    <FieldFrame
      error={error}
      helperText={helperText}
      id={id}
      label={label}
      optional={optional}
    >
      {({ controlId, messageId }) => (
        <input
          aria-describedby={messageId}
          aria-invalid={Boolean(error)}
          className={`field__control ${className}`.trim()}
          id={controlId}
          ref={ref}
          {...props}
        />
      )}
    </FieldFrame>
  );
});

export type PasswordInputProps = Omit<InputProps, 'type'>;

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(props, ref) {
    const [visible, setVisible] = useState(false);
    const {
      className = '',
      error,
      helperText,
      id,
      label,
      optional,
      ...inputProps
    } = props;

    return (
      <FieldFrame
        error={error}
        helperText={helperText}
        id={id}
        label={label}
        optional={optional}
      >
        {({ controlId, messageId }) => (
          <div className="field__control-wrap">
            <input
              aria-describedby={messageId}
              aria-invalid={Boolean(error)}
              className={`field__control field__control--with-trailing ${className}`.trim()}
              id={controlId}
              ref={ref}
              type={visible ? 'text' : 'password'}
              {...inputProps}
            />
            <IconButton
              className="field__trailing"
              icon={visible ? 'eye-off' : 'eye'}
              label={visible ? 'Ocultar senha' : 'Mostrar senha'}
              onClick={() => setVisible((current) => !current)}
              size="sm"
            />
          </div>
        )}
      </FieldFrame>
    );
  },
);

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> &
  FieldMetaProps & {
    options: SelectOption[];
    placeholder?: string;
  };

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    {
      className = '',
      error,
      helperText,
      id,
      label,
      optional,
      options,
      placeholder,
      ...props
    },
    ref,
  ) {
    return (
      <FieldFrame
        error={error}
        helperText={helperText}
        id={id}
        label={label}
        optional={optional}
      >
        {({ controlId, messageId }) => (
          <select
            aria-describedby={messageId}
            aria-invalid={Boolean(error)}
            className={`select ${className}`.trim()}
            id={controlId}
            ref={ref}
            {...props}
          >
            {placeholder ? (
              <option disabled value="">
                {placeholder}
              </option>
            ) : null}
            {options.map((option) => (
              <option
                disabled={option.disabled}
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        )}
      </FieldFrame>
    );
  },
);

export type ComboboxProps = InputProps & {
  options: string[];
};

export const Combobox = forwardRef<HTMLInputElement, ComboboxProps>(
  function Combobox(
    {
      className = '',
      error,
      helperText,
      id,
      label,
      optional,
      options,
      ...props
    },
    ref,
  ) {
    const generatedId = useId();
    const listId = `${id ?? generatedId}-options`;

    return (
      <FieldFrame
        error={error}
        helperText={helperText}
        id={id}
        label={label}
        optional={optional}
      >
        {({ controlId, messageId }) => (
          <>
            <input
              aria-describedby={messageId}
              aria-invalid={Boolean(error)}
              autoComplete="off"
              className={`combobox ${className}`.trim()}
              id={controlId}
              list={listId}
              ref={ref}
              role="combobox"
              {...props}
            />
            <datalist id={listId}>
              {options.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </>
        )}
      </FieldFrame>
    );
  },
);

export type CurrencyInputProps = Omit<InputProps, 'type'> & {
  currency?: string;
};

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  function CurrencyInput(
    {
      className = '',
      currency = 'BRL',
      error,
      helperText,
      id,
      label,
      optional,
      ...props
    },
    ref,
  ) {
    return (
      <FieldFrame
        error={error}
        helperText={helperText}
        id={id}
        label={label}
        optional={optional}
      >
        {({ controlId, messageId }) => (
          <div className="currency-input-wrap">
            <span aria-hidden="true" className="currency-input__currency">
              {currency}
            </span>
            <input
              aria-describedby={messageId}
              aria-invalid={Boolean(error)}
              className={`currency-input ${className}`.trim()}
              id={controlId}
              inputMode="decimal"
              ref={ref}
              type="text"
              {...props}
            />
          </div>
        )}
      </FieldFrame>
    );
  },
);

export type DatePickerProps = Omit<InputProps, 'type'>;

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  function DatePicker(props, ref) {
    return <Input ref={ref} type="date" {...props} />;
  },
);

export type DateRangeValue = {
  start: string;
  end: string;
};

type DateRangePickerProps = {
  label: string;
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  error?: string;
  disabled?: boolean;
};

export function DateRangePicker({
  disabled,
  error,
  label,
  onChange,
  value,
}: DateRangePickerProps) {
  return (
    <fieldset className={`field ${error ? 'field--error' : ''}`}>
      <legend className="text-label">{label}</legend>
      <div className="showcase-form">
        <Input
          disabled={disabled}
          label="Data inicial"
          max={value.end || undefined}
          onChange={(event) =>
            onChange({ ...value, start: event.currentTarget.value })
          }
          type="date"
          value={value.start}
        />
        <Input
          disabled={disabled}
          label="Data final"
          min={value.start || undefined}
          onChange={(event) =>
            onChange({ ...value, end: event.currentTarget.value })
          }
          type="date"
          value={value.end}
        />
      </div>
      {error ? <span className="field__message">{error}</span> : null}
    </fieldset>
  );
}

type ChoiceProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
};

export function Checkbox({ className = '', label, ...props }: ChoiceProps) {
  return (
    <label className={`choice ${className}`.trim()}>
      <input type="checkbox" {...props} />
      <span aria-hidden="true" className="choice__control">
        <span aria-hidden="true">✓</span>
      </span>
      <span>{label}</span>
    </label>
  );
}

export function Radio({ className = '', label, ...props }: ChoiceProps) {
  return (
    <label className={`choice choice--radio ${className}`.trim()}>
      <input type="radio" {...props} />
      <span aria-hidden="true" className="choice__control" />
      <span>{label}</span>
    </label>
  );
}

export function Switch({ className = '', label, ...props }: ChoiceProps) {
  return (
    <label className={`switch ${className}`.trim()}>
      <input role="switch" type="checkbox" {...props} />
      <span aria-hidden="true" className="switch__track">
        <span className="switch__thumb" />
      </span>
      <span>{label}</span>
    </label>
  );
}
