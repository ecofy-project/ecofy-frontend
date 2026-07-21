import { Card, Input } from '../../../components/ui';

const preferenceLabels: Readonly<Record<string, string>> = {
  DEFAULT_CURRENCY: 'Moeda padrão',
  LOCALE: 'Localidade',
  NOTIFY_CHANNELS: 'Canais de notificação',
  TIMEZONE: 'Fuso horário',
  DATE_FORMAT: 'Formato de data',
  THEME: 'Tema preferido',
};

const preferenceDescriptions: Readonly<Record<string, string>> = {
  DEFAULT_CURRENCY: 'Código da moeda usada nas visualizações financeiras.',
  LOCALE: 'Formato regional usado na sua conta.',
  NOTIFY_CHANNELS: 'Canais configurados para comunicações.',
  TIMEZONE: 'Referência de horário para datas e atividades.',
  DATE_FORMAT: 'Padrão de exibição das datas.',
  THEME: 'Preferência visual registrada no seu perfil.',
};

export function PreferenceField({
  onChange,
  preferenceKey,
  value,
}: {
  onChange: (value: string) => void;
  preferenceKey: string;
  value: string;
}) {
  const label = preferenceLabels[preferenceKey] ?? 'Configuração da conta';

  return (
    <Card as="section" className="preference-card">
      <div className="preference-card__heading">
        <span className="preference-card__key numeric">{preferenceKey}</span>
        <h2>{label}</h2>
        <p>
          {preferenceDescriptions[preferenceKey] ??
            'Preferência fornecida pelo serviço da sua conta.'}
        </p>
      </div>
      <Input
        label={`Valor de ${preferenceLabels[preferenceKey] ?? preferenceKey}`}
        onChange={(event) => onChange(event.currentTarget.value)}
        value={value}
      />
    </Card>
  );
}
