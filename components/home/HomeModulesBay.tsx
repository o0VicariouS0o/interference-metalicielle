import { ReactNode } from 'react';

type HomeModulesBayProps = {
  children: ReactNode;
};

export function HomeModulesBay({ children }: HomeModulesBayProps) {
  return (
    <div className="homeModulesBay">
      <img
        className="homeModulesBay__back"
        src="/assets/svg/panels/modules/modules_back.svg"
        alt=""
        aria-hidden="true"
      />

      <div className="homeModulesBay__content">
        {children}
      </div>

      <img
        className="homeModulesBay__screens"
        src="/assets/svg/panels/modules/modules_screens.svg"
        alt=""
        aria-hidden="true"
      />

      <img
        className="homeModulesBay__pieces"
        src="/assets/svg/panels/modules/modules_pieces.svg"
        alt=""
        aria-hidden="true"
      />
    </div>
  );
}