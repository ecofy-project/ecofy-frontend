import { useState } from 'react';
import {
  Alert,
  Button,
  Input,
  Modal,
  Select,
  useToast,
} from '../../../components/ui';
import type { ApiError } from '../../../services/errors/api-error';
import type {
  CategorizationRule,
  Category,
  CreateRuleInput,
  RuleStatus,
} from '../types/categorization';
import { ruleStatuses } from '../types/categorization';
import {
  describeCondition,
  ruleStatusLabels,
} from '../utils/categorization-labels';
import {
  createConditionDraft,
  RuleConditionEditor,
  type ConditionDraft,
} from './RuleConditionEditor';

const steps = ['Informações', 'Condições', 'Categoria', 'Revisão'] as const;

const statusOptions = ruleStatuses.map((status) => ({
  value: status,
  label: ruleStatusLabels[status],
}));

type RuleWizardProps = {
  open: boolean;
  categories: readonly Category[];
  isCreating: boolean;
  error: ApiError | null;
  onClose: () => void;
  onSubmit: (
    input: CreateRuleInput,
  ) => Promise<
    { ok: true; data: CategorizationRule } | { ok: false; error: ApiError }
  >;
};

/**
 * Formulário progressivo que apenas coleta dados e monta `CreateRuleRequest`.
 * A avaliação das regras permanece integralmente no backend.
 */
export function RuleWizard({
  categories,
  error,
  isCreating,
  onClose,
  onSubmit,
  open,
}: RuleWizardProps) {
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [status, setStatus] = useState<RuleStatus>('ACTIVE');
  const [priority, setPriority] = useState('0');
  const [categoryId, setCategoryId] = useState('');
  const [conditions, setConditions] = useState<ConditionDraft[]>([
    createConditionDraft(),
  ]);
  const [nameError, setNameError] = useState('');
  const [priorityError, setPriorityError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [conditionErrors, setConditionErrors] = useState<
    Record<string, string>
  >({});

  const selectedCategory = categories.find(
    (category) => category.id === categoryId,
  );

  function resetWizard() {
    setStep(0);
    setName('');
    setStatus('ACTIVE');
    setPriority('0');
    setCategoryId('');
    setConditions([createConditionDraft()]);
    setNameError('');
    setPriorityError('');
    setCategoryError('');
    setConditionErrors({});
  }

  function handleClose() {
    if (isCreating) {
      return;
    }

    resetWizard();
    onClose();
  }

  function validateInformation() {
    const parsedPriority = Number(priority);
    const invalidName = !name.trim();
    const invalidPriority =
      priority.trim() === '' || !Number.isInteger(parsedPriority);

    setNameError(invalidName ? 'Informe o nome da regra.' : '');
    setPriorityError(
      invalidPriority ? 'Informe uma prioridade em número inteiro.' : '',
    );

    return !invalidName && !invalidPriority;
  }

  function validateConditions() {
    const errors = Object.fromEntries(
      conditions
        .filter((condition) => !condition.value.trim())
        .map((condition) => [condition.key, 'Informe o valor da condição.']),
    );

    setConditionErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function validateCategory() {
    const invalid = !categoryId;
    setCategoryError(invalid ? 'Selecione a categoria de destino.' : '');
    return !invalid;
  }

  function goToNextStep() {
    const validators = [
      validateInformation,
      validateConditions,
      validateCategory,
    ];
    const validate = validators[step];

    if (validate && !validate()) {
      return;
    }

    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function buildInput(): CreateRuleInput {
    return {
      categoryId,
      name: name.trim(),
      status,
      priority: Number(priority),
      conditions: conditions.map((condition) => {
        const weight = Number(condition.weight);

        return {
          field: condition.field,
          operator: condition.operator,
          value: condition.value.trim(),
          ...(condition.weight.trim() && Number.isInteger(weight) && weight > 0
            ? { weight }
            : {}),
        };
      }),
    };
  }

  async function handleSubmit() {
    if (!validateInformation() || !validateConditions() || !validateCategory()) {
      return;
    }

    const result = await onSubmit(buildInput());

    if (!result.ok) {
      return;
    }

    resetWizard();
    onClose();
    showToast({
      title: 'Regra criada',
      message: 'A regra foi enviada ao serviço de categorização.',
      tone: 'success',
    });
  }

  return (
    <Modal
      footer={
        <>
          <Button
            disabled={isCreating}
            onClick={step === 0 ? handleClose : () => setStep(step - 1)}
            variant="ghost"
          >
            {step === 0 ? 'Cancelar' : 'Voltar'}
          </Button>
          {step === steps.length - 1 ? (
            <Button loading={isCreating} onClick={handleSubmit} type="button">
              Criar regra
            </Button>
          ) : (
            <Button onClick={goToNextStep} type="button">
              Continuar
            </Button>
          )}
        </>
      }
      onClose={handleClose}
      open={open}
      title="Nova regra de categorização"
    >
      <div className="rule-wizard">
        <ol aria-label="Etapas da regra" className="rule-wizard__steps">
          {steps.map((label, index) => (
            <li
              aria-current={index === step ? 'step' : undefined}
              className={`rule-wizard__step ${
                index === step ? 'rule-wizard__step--current' : ''
              } ${index < step ? 'rule-wizard__step--done' : ''}`.trim()}
              key={label}
            >
              <span className="rule-wizard__step-index numeric">
                {index + 1}
              </span>
              <span>{label}</span>
            </li>
          ))}
        </ol>

        {error ? (
          <Alert title="Não foi possível criar a regra" tone="danger">
            {error.message}
          </Alert>
        ) : null}

        <div className="categorization-form">
          {step === 0 ? (
            <>
              <Input
                autoFocus
                error={nameError}
                label="Nome da regra"
                onChange={(event) => setName(event.currentTarget.value)}
                placeholder="Ex.: Compras de mercado"
                value={name}
              />
              <Select
                label="Status"
                onChange={(event) =>
                  setStatus(event.currentTarget.value as RuleStatus)
                }
                options={statusOptions}
                value={status}
              />
              <Input
                error={priorityError}
                helperText="Número inteiro usado pelo serviço para ordenar as regras."
                label="Prioridade"
                onChange={(event) => setPriority(event.currentTarget.value)}
                step={1}
                type="number"
                value={priority}
              />
            </>
          ) : null}

          {step === 1 ? (
            <RuleConditionEditor
              conditions={conditions}
              errors={conditionErrors}
              onChange={setConditions}
            />
          ) : null}

          {step === 2 ? (
            <Select
              error={categoryError}
              helperText="As categorias vêm do serviço de categorização."
              label="Categoria de destino"
              onChange={(event) => setCategoryId(event.currentTarget.value)}
              options={categories.map((category) => ({
                value: category.id,
                label: category.name,
              }))}
              placeholder="Selecione uma categoria"
              value={categoryId}
            />
          ) : null}

          {step === 3 ? (
            <dl className="rule-review">
              <div>
                <dt>Nome</dt>
                <dd>{name.trim()}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{ruleStatusLabels[status]}</dd>
              </div>
              <div>
                <dt>Prioridade</dt>
                <dd className="numeric">{priority}</dd>
              </div>
              <div>
                <dt>Condições</dt>
                <dd>
                  <ul className="rule-review__conditions">
                    {conditions.map((condition) => (
                      <li key={condition.key}>
                        {describeCondition(
                          condition.field,
                          condition.operator,
                          condition.value.trim(),
                        )}
                        {condition.weight.trim()
                          ? ` · peso ${condition.weight.trim()}`
                          : ''}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
              <div>
                <dt>Categoria</dt>
                <dd>{selectedCategory?.name ?? '—'}</dd>
              </div>
            </dl>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
