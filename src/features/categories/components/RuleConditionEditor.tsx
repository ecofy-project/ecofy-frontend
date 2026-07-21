import { Button, IconButton, Input, Select } from '../../../components/ui';
import {
  matchOperatorLabels,
  operatorsByField,
  ruleConditionFieldLabels,
} from '../utils/categorization-labels';
import {
  ruleConditionFields,
  type MatchOperator,
  type RuleConditionField,
} from '../types/categorization';

export type ConditionDraft = {
  key: string;
  field: RuleConditionField;
  operator: MatchOperator;
  value: string;
  weight: string;
};

const fieldOptions = ruleConditionFields.map((field) => ({
  value: field,
  label: ruleConditionFieldLabels[field],
}));

export function createConditionDraft(): ConditionDraft {
  return {
    key: globalThis.crypto?.randomUUID?.() ?? `condition-${Date.now()}`,
    field: 'description',
    operator: operatorsByField.description[0],
    value: '',
    weight: '',
  };
}

type RuleConditionEditorProps = {
  conditions: ConditionDraft[];
  errors: Readonly<Record<string, string>>;
  onChange: (conditions: ConditionDraft[]) => void;
};

/**
 * Editor das condições da regra. Os operadores exibidos vêm exclusivamente do
 * enum `MatchOperator` publicado pelo ms-categorization.
 */
export function RuleConditionEditor({
  conditions,
  errors,
  onChange,
}: RuleConditionEditorProps) {
  function updateCondition(key: string, patch: Partial<ConditionDraft>) {
    onChange(
      conditions.map((condition) =>
        condition.key === key ? { ...condition, ...patch } : condition,
      ),
    );
  }

  function changeField(key: string, field: RuleConditionField) {
    updateCondition(key, { field, operator: operatorsByField[field][0] });
  }

  return (
    <div className="rule-conditions">
      <ul className="rule-conditions__list">
        {conditions.map((condition, index) => (
          <li className="rule-condition" key={condition.key}>
            <div className="rule-condition__header">
              <span className="categorization-eyebrow">
                Condição {index + 1}
              </span>
              {conditions.length > 1 ? (
                <IconButton
                  icon="close"
                  label={`Remover condição ${index + 1}`}
                  onClick={() =>
                    onChange(
                      conditions.filter((item) => item.key !== condition.key),
                    )
                  }
                  size="sm"
                />
              ) : null}
            </div>
            <div className="rule-condition__grid">
              <Select
                label="Campo"
                onChange={(event) =>
                  changeField(
                    condition.key,
                    event.currentTarget.value as RuleConditionField,
                  )
                }
                options={fieldOptions}
                value={condition.field}
              />
              <Select
                label="Operador"
                onChange={(event) =>
                  updateCondition(condition.key, {
                    operator: event.currentTarget.value as MatchOperator,
                  })
                }
                options={operatorsByField[condition.field].map((operator) => ({
                  value: operator,
                  label: matchOperatorLabels[operator],
                }))}
                value={condition.operator}
              />
              <Input
                error={errors[condition.key]}
                inputMode={condition.field === 'amount' ? 'decimal' : undefined}
                label="Valor"
                onChange={(event) =>
                  updateCondition(condition.key, {
                    value: event.currentTarget.value,
                  })
                }
                placeholder={
                  condition.field === 'amount' ? 'Ex.: 1000' : 'Ex.: mercado'
                }
                value={condition.value}
              />
              <Input
                helperText="Peso opcional aplicado pelo serviço (padrão 1)."
                label="Peso"
                min={1}
                onChange={(event) =>
                  updateCondition(condition.key, {
                    weight: event.currentTarget.value,
                  })
                }
                optional
                step={1}
                type="number"
                value={condition.weight}
              />
            </div>
          </li>
        ))}
      </ul>
      <Button
        onClick={() => onChange([...conditions, createConditionDraft()])}
        type="button"
        variant="outline"
      >
        Adicionar condição
      </Button>
    </div>
  );
}
