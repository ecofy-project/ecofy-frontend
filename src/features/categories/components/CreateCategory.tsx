import { useState, type FormEvent } from 'react';
import {
  Alert,
  Button,
  Input,
  Modal,
  Switch,
  useToast,
} from '../../../components/ui';
import type { ApiError } from '../../../services/errors/api-error';
import { readCategorizationFieldErrors } from '../hooks/categorization-errors';
import type { Category, CreateCategoryInput } from '../types/categorization';

const formId = 'create-category-form';
const defaultColor = '#12a594';
const categoryFields = ['name', 'color'] as const;

type CreateCategoryProps = {
  open: boolean;
  isCreating: boolean;
  error: ApiError | null;
  onClose: () => void;
  onSubmit: (
    input: CreateCategoryInput,
  ) => Promise<{ ok: true; data: Category } | { ok: false; error: ApiError }>;
};

/**
 * Formulário de criação de categoria. Envia apenas `name` e, quando o usuário
 * escolhe explicitamente, `color` — os únicos campos de `CreateCategoryRequest`.
 */
export function CreateCategory({
  error,
  isCreating,
  onClose,
  onSubmit,
  open,
}: CreateCategoryProps) {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [useColor, setUseColor] = useState(false);
  const [color, setColor] = useState(defaultColor);
  const [nameError, setNameError] = useState('');

  const fieldErrors = error
    ? readCategorizationFieldErrors(error, categoryFields)
    : {};
  const showGeneralError = Boolean(
    error && !fieldErrors.name && !fieldErrors.color,
  );

  function resetForm() {
    setName('');
    setUseColor(false);
    setColor(defaultColor);
    setNameError('');
  }

  function handleClose() {
    if (isCreating) {
      return;
    }

    resetForm();
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = name.trim();

    if (!normalizedName) {
      setNameError('Informe o nome da categoria.');
      return;
    }

    setNameError('');
    const result = await onSubmit({
      name: normalizedName,
      ...(useColor ? { color } : {}),
    });

    if (!result.ok) {
      return;
    }

    resetForm();
    onClose();
    showToast({
      title: 'Categoria criada',
      message: 'Categoria criada com sucesso.',
      tone: 'success',
    });
  }

  return (
    <Modal
      footer={
        <>
          <Button disabled={isCreating} onClick={handleClose} variant="ghost">
            Cancelar
          </Button>
          <Button form={formId} loading={isCreating} type="submit">
            Criar categoria
          </Button>
        </>
      }
      onClose={handleClose}
      open={open}
      title="Nova categoria"
    >
      <form className="categorization-form" id={formId} onSubmit={handleSubmit}>
        {showGeneralError && error ? (
          <Alert title="Não foi possível criar a categoria" tone="danger">
            {error.message}
          </Alert>
        ) : null}
        <Input
          autoFocus
          error={nameError || fieldErrors.name}
          label="Nome"
          onChange={(event) => {
            setName(event.currentTarget.value);
            setNameError('');
          }}
          placeholder="Ex.: Pets"
          value={name}
        />
        <Switch
          checked={useColor}
          label="Definir uma cor de identificação"
          onChange={(event) => setUseColor(event.currentTarget.checked)}
        />
        {useColor ? (
          <Input
            error={fieldErrors.color}
            helperText="A cor é opcional e serve apenas para identificar a categoria."
            label="Cor"
            onChange={(event) => setColor(event.currentTarget.value)}
            type="color"
            value={color}
          />
        ) : null}
      </form>
    </Modal>
  );
}
