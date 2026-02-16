import React, { createContext, useContext, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@lib/utils/cn';
import { uiStore } from '@store/ui.store';
import {
  sidebarVariants,
  sidebarPanelVariants,
  sidebarHeaderVariants,
  sidebarNavVariants,
  sidebarSectionLabelVariants,
  sidebarItemVariants,
  sidebarFooterVariants,
} from './Sidebar.styles';
import { sidebarOverlayVariants, sidebarPanelMotion } from './Sidebar.animations';
import { useSidebar } from './useSidebar';
import {
  SidebarContextValue,
  SidebarFooterProps,
  SidebarHeaderProps,
  SidebarItemProps,
  SidebarNavProps,
  SidebarProps,
  SidebarSectionProps,
} from './Sidebar.types';

const SidebarContext = createContext<SidebarContextValue | null>(null);

const useSidebarContext = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('Sidebar components must be used within Sidebar');
  }
  return context;
};

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ title = 'WorkForge', subtitle, logo, className }) => {
  const { variant } = useSidebarContext();

  return (
    <div className={cn(sidebarHeaderVariants({ variant }), className)}>
      {logo ? <div className="flex items-center">{logo}</div> : null}
      {variant === 'compact' ? null : (
        <div>
          <div className="text-lg font-semibold text-slate-900 dark:text-white">{title}</div>
          {subtitle ? (
            <div className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</div>
          ) : null}
        </div>
      )}
    </div>
  );
};

const SidebarNav: React.FC<SidebarNavProps> = ({ className, children, ariaLabel }) => {
  const { variant } = useSidebarContext();
  return (
    <nav
      aria-label={ariaLabel || 'Sidebar navigation'}
      className={cn(sidebarNavVariants({ variant }), className)}
    >
      {children}
    </nav>
  );
};

const SidebarSection: React.FC<SidebarSectionProps> = ({ section, className }) => {
  const { variant } = useSidebarContext();

  return (
    <div className={cn('space-y-2', className)}>
      <div className={sidebarSectionLabelVariants({ variant })}>{section.label}</div>
      <div className="space-y-1">
        {section.items.map((item) => (
          <SidebarItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

const SidebarItem: React.FC<SidebarItemProps> = ({ item, className }) => {
  const { activePath, variant } = useSidebarContext();

  const isActive = activePath === item.to || activePath.startsWith(item.to + '/');

  return (
    <NavLink
      to={item.to}
      className={cn(sidebarItemVariants({ active: isActive, variant }), className)}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="flex items-center justify-center text-slate-500 dark:text-slate-400">
        {item.icon ? <item.icon className="h-5 w-5" /> : null}
      </span>
      {variant === 'compact' ? null : (
        <span className="flex-1 truncate">{item.label}</span>
      )}
      {variant === 'compact' || item.badge === undefined ? null : (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {item.badge}
        </span>
      )}
    </NavLink>
  );
};

const SidebarFooter: React.FC<SidebarFooterProps> = ({ children, className }) => {
  const { variant } = useSidebarContext();
  return <div className={cn(sidebarFooterVariants({ variant }), className)}>{children}</div>;
};

const SidebarDefaultContent: React.FC = () => {
  const { sections } = useSidebarContext();

  return (
    <>
      <SidebarHeader />
      <SidebarNav>
        <div className="space-y-6">
          {sections.map((section) => (
            <SidebarSection key={section.id} section={section} />
          ))}
        </div>
      </SidebarNav>
      <SidebarFooter>
        <div className="text-xs text-slate-500 dark:text-slate-400">WorkForge v1.0</div>
      </SidebarFooter>
    </>
  );
};

const SidebarRoot: React.FC<SidebarProps> = ({
  isOpen,
  mobileOpen = false,
  onMobileClose,
  variant = 'default',
  className,
  children,
  ariaLabel,
}) => {
  const { sidebarOpen } = uiStore();
  const { sections, activePath } = useSidebar();
  const resolvedOpen = isOpen ?? sidebarOpen;

  const contextValue = useMemo(
    () => ({
      isOpen: resolvedOpen,
      mobileOpen,
      onMobileClose,
      variant,
      sections,
      activePath,
    }),
    [resolvedOpen, mobileOpen, onMobileClose, variant, sections, activePath]
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <aside className={cn(sidebarVariants({ variant }), className)} aria-label={ariaLabel || 'Sidebar'}>
        <div className={sidebarPanelVariants({ variant })}>
          {children || <SidebarDefaultContent />}
        </div>
      </aside>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            className="fixed inset-0 z-40 flex lg:hidden"
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.button
              type="button"
              className="fixed inset-0 bg-slate-900/40"
              aria-label="Close sidebar"
              onClick={onMobileClose}
              variants={sidebarOverlayVariants}
            />
            <motion.aside
              className="relative z-50 flex h-full"
              variants={sidebarPanelMotion}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className={sidebarPanelVariants({ variant })}>
                {children || <SidebarDefaultContent />}
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </SidebarContext.Provider>
  );
};

export const Sidebar = Object.assign(SidebarRoot, {
  Root: SidebarRoot,
  Header: SidebarHeader,
  Nav: SidebarNav,
  Section: SidebarSection,
  Item: SidebarItem,
  Footer: SidebarFooter,
});
