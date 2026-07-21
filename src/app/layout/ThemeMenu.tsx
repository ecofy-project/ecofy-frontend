import { IconButton } from '../../components/ui';
import { useTheme } from '../providers/ThemeProvider';

export function ThemeMenu() {
  const { preference, resolvedTheme, setPreference } = useTheme();
  const nextTheme =
    preference === 'light' ? 'dark' : preference === 'dark' ? 'system' : 'light';
  const nextLabel = {
    light: 'claro',
    dark: 'escuro',
    system: 'do sistema',
  }[nextTheme];

  return (
    <IconButton
      icon={preference === 'system' ? 'theme' : resolvedTheme === 'light' ? 'sun' : 'moon'}
      label={`Ativar tema ${nextLabel}`}
      onClick={() => setPreference(nextTheme)}
    />
  );
}
