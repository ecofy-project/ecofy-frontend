import type { CSSProperties, ReactNode } from 'react';
import { Brand } from '../../../app/layout/Brand';
import { ThemeMenu } from '../../../app/layout/ThemeMenu';
import { AppLink } from '../../../app/routing/router';
import { Icon } from '../../../components/ui';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-shell">
      <a className="skip-link" href="#auth-content">
        Ir para o conteúdo
      </a>
      <aside className="auth-story">
        <AppLink
          aria-label="EcoFy — acesso"
          className="auth-story__brand"
          to="/login"
        >
          <Brand />
        </AppLink>
        <div className="auth-story__copy">
          <span className="auth-story__eyebrow">FINANÇAS COM CLAREZA</span>
          <h1>Organize hoje. Respire melhor amanhã.</h1>
          <p>
            Um espaço sereno para transformar movimentações em decisões mais
            conscientes.
          </p>
          <div
            aria-label="EcoFy ajuda você a visualizar, entender e decidir"
            className="auth-story__signal"
            role="img"
          >
            <div className="auth-story__signal-header">
              <span>SEU MÊS, EM UMA LEITURA</span>
              <Icon name="insights" size={18} />
            </div>
            <div className="auth-story__signal-row">
              <span>Visualize</span>
              <i style={{ '--signal-width': '82%' } as CSSProperties} />
            </div>
            <div className="auth-story__signal-row">
              <span>Entenda</span>
              <i style={{ '--signal-width': '64%' } as CSSProperties} />
            </div>
            <div className="auth-story__signal-row">
              <span>Decida</span>
              <i style={{ '--signal-width': '72%' } as CSSProperties} />
            </div>
          </div>
        </div>
        <ul className="auth-story__principles">
          <li>
            <span>Visão</span>
            <p>Visão simples do que importa</p>
          </li>
          <li>
            <span>Contexto</span>
            <p>Decisões guiadas por contexto</p>
          </li>
          <li>
            <span>Cuidado</span>
            <p>Privacidade tratada com cuidado</p>
          </li>
        </ul>
        <p className="auth-story__signature">EcoFy · finanças com intenção</p>
      </aside>
      <main className="auth-main" id="auth-content" tabIndex={-1}>
        <div className="auth-main__toolbar">
          <AppLink
            aria-label="EcoFy — acesso"
            className="auth-main__brand"
            to="/login"
          >
            <Brand />
          </AppLink>
          <ThemeMenu />
        </div>
        <div className="auth-main__content">{children}</div>
      </main>
    </div>
  );
}
