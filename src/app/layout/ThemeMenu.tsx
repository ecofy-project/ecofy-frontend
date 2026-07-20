import {
  Dropdown,
  DropdownItem,
  IconButton,
} from '../../components/ui';
import {
  useTheme,
  type ThemePreference,
} from '../providers/ThemeProvider';

const themeLabels: Record<ThemePreference, string> = {
  light: 'Claro',
  dark: 'Escuro',
  system: 'Sistema',
};

export function ThemeMenu() {
  const { preference, resolvedTheme, setPreference } = useTheme();

  return (
    <Dropdown
      label="Escolher tema"
      trigger={
        <IconButton
          icon="theme"
          label={`Tema: ${themeLabels[preference]} (${resolvedTheme})`}
        />
      }
    >
      {(['light', 'dark', 'system'] as const).map((theme) => (
        <DropdownItem key={theme} onSelect={() => setPreference(theme)}>
          <span aria-hidden="true">{preference === theme ? '✓' : ' '}</span>
          {themeLabels[theme]}
        </DropdownItem>
      ))}
    </Dropdown>
  );
}
