import React, { useEffect, useMemo, useState } from 'react';
import { Cog6ToothIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { AdminLayout } from '@components/admin/layout/AdminLayout';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Textarea } from '@components/ui/Textarea';
import { usePlatformSettings } from '@hooks/useAdmin';
import { adminService } from '@services/admin.service';
import type { PlatformSettings, EmailTemplate } from '@types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

const Settings: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: settings, isLoading, error } = usePlatformSettings();
  const { data: emailTemplates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['admin', 'email-templates'],
    queryFn: () => adminService.getEmailTemplates(),
  });

  const [draft, setDraft] = useState<PlatformSettings | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [templateDraft, setTemplateDraft] = useState<Pick<EmailTemplate, 'subject' | 'body'>>({
    subject: '',
    body: '',
  });

  useEffect(() => {
    if (settings) {
      setDraft(settings);
    }
  }, [settings]);

  const selectedTemplate = useMemo(
    () => emailTemplates.find((template) => template.id === selectedTemplateId),
    [emailTemplates, selectedTemplateId]
  );

  useEffect(() => {
    if (selectedTemplate) {
      setTemplateDraft({
        subject: selectedTemplate.subject,
        body: selectedTemplate.body,
      });
    }
  }, [selectedTemplate]);

  useEffect(() => {
    if (!selectedTemplateId && emailTemplates.length > 0) {
      setSelectedTemplateId(emailTemplates[0].id);
    }
  }, [emailTemplates, selectedTemplateId]);

  const updateSettingsMutation = useMutation({
    mutationFn: (payload: Partial<PlatformSettings>) => adminService.updatePlatformSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      toast.success('Platform settings updated');
    },
    onError: (mutationError: any) => {
      toast.error(mutationError?.response?.data?.error || 'Failed to update platform settings');
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ templateId, payload }: { templateId: string; payload: Partial<EmailTemplate> }) =>
      adminService.updateEmailTemplate(templateId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'email-templates'] });
      toast.success('Email template updated');
    },
    onError: (mutationError: any) => {
      toast.error(mutationError?.response?.data?.error || 'Failed to update template');
    },
  });

  const handleNumberChange = (field: keyof PlatformSettings, value: string) => {
    if (!draft) return;
    const parsed = Number(value);
    setDraft({
      ...draft,
      [field]: Number.isNaN(parsed) ? 0 : parsed,
    });
  };

  const handleBooleanChange = (field: keyof PlatformSettings) => {
    if (!draft) return;
    setDraft({
      ...draft,
      [field]: !draft[field],
    });
  };

  const handleStringChange = (field: keyof PlatformSettings, value: string) => {
    if (!draft) return;
    setDraft({
      ...draft,
      [field]: value,
    });
  };

  const saveSettings = () => {
    if (!draft) return;
    updateSettingsMutation.mutate(draft);
  };

  const saveTemplate = () => {
    if (!selectedTemplateId) return;
    updateTemplateMutation.mutate({
      templateId: selectedTemplateId,
      payload: {
        subject: templateDraft.subject,
        body: templateDraft.body,
      },
    });
  };

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-rose-100/50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl p-6">
          <p className="text-rose-600 dark:text-rose-400">
            Error loading settings: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage platform configuration and email templates</p>
      </div>

      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Cog6ToothIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Platform Settings</h2>
        </div>

        {isLoading || !draft ? (
          <p className="text-gray-500 dark:text-gray-400">Loading settings...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Platform Fee (%)"
                type="number"
                value={draft.platform_fee_percentage}
                onChange={(event) => handleNumberChange('platform_fee_percentage', event.target.value)}
              />
              <Input
                label="Minimum Platform Fee"
                type="number"
                value={draft.minimum_platform_fee}
                onChange={(event) => handleNumberChange('minimum_platform_fee', event.target.value)}
              />
              <Input
                label="Maximum Platform Fee"
                type="number"
                value={draft.maximum_platform_fee}
                onChange={(event) => handleNumberChange('maximum_platform_fee', event.target.value)}
              />
              <Input
                label="Job Expiry Days"
                type="number"
                value={draft.job_expiry_days}
                onChange={(event) => handleNumberChange('job_expiry_days', event.target.value)}
              />
              <Input
                label="Featured Job Price"
                type="number"
                value={draft.featured_job_price}
                onChange={(event) => handleNumberChange('featured_job_price', event.target.value)}
              />
              <Input
                label="Minimum Payout Amount"
                type="number"
                value={draft.minimum_payout_amount}
                onChange={(event) => handleNumberChange('minimum_payout_amount', event.target.value)}
              />
              <Input
                label="Escrow Release Days"
                type="number"
                value={draft.escrow_release_days}
                onChange={(event) => handleNumberChange('escrow_release_days', event.target.value)}
              />
              <Input
                label="Max Login Attempts"
                type="number"
                value={draft.max_login_attempts}
                onChange={(event) => handleNumberChange('max_login_attempts', event.target.value)}
              />
              <Input
                label="Session Timeout (minutes)"
                type="number"
                value={draft.session_timeout_minutes}
                onChange={(event) => handleNumberChange('session_timeout_minutes', event.target.value)}
              />
              <Input
                label="Verification Score Threshold"
                type="number"
                value={draft.verification_score_threshold}
                onChange={(event) => handleNumberChange('verification_score_threshold', event.target.value)}
              />
              <Input
                label="Max Verification Attempts"
                type="number"
                value={draft.max_verification_attempts}
                onChange={(event) => handleNumberChange('max_verification_attempts', event.target.value)}
              />
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Payout Schedule</label>
                <select
                  value={draft.payout_schedule}
                  onChange={(event) => handleStringChange('payout_schedule', event.target.value)}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <button
                onClick={() => handleBooleanChange('job_approval_required')}
                className={`rounded-xl px-4 py-3 text-sm font-medium border ${draft.job_approval_required ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'}`}
              >
                Job Approval Required: {draft.job_approval_required ? 'On' : 'Off'}
              </button>
              <button
                onClick={() => handleBooleanChange('verification_required')}
                className={`rounded-xl px-4 py-3 text-sm font-medium border ${draft.verification_required ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'}`}
              >
                Verification Required: {draft.verification_required ? 'On' : 'Off'}
              </button>
              <button
                onClick={() => handleBooleanChange('two_factor_required')}
                className={`rounded-xl px-4 py-3 text-sm font-medium border ${draft.two_factor_required ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'}`}
              >
                Two-Factor Required: {draft.two_factor_required ? 'On' : 'Off'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Sender Email"
                value={draft.sender_email}
                onChange={(event) => handleStringChange('sender_email', event.target.value)}
              />
              <Input
                label="Sender Name"
                value={draft.sender_name}
                onChange={(event) => handleStringChange('sender_name', event.target.value)}
              />
            </div>

            <Textarea
              label="Email Signature"
              rows={4}
              value={draft.email_signature}
              onChange={(event) => handleStringChange('email_signature', event.target.value)}
            />

            <div className="flex justify-end">
              <Button onClick={saveSettings} isLoading={updateSettingsMutation.isPending}>
                Save Platform Settings
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 p-6 space-y-6">
        <div className="flex items-center gap-3">
          <EnvelopeIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Email Templates</h2>
        </div>

        {templatesLoading ? (
          <p className="text-gray-500 dark:text-gray-400">Loading templates...</p>
        ) : emailTemplates.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No templates returned by API.</p>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Template</label>
              <select
                value={selectedTemplateId}
                onChange={(event) => setSelectedTemplateId(event.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2"
              >
                {emailTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Subject"
              value={templateDraft.subject}
              onChange={(event) => setTemplateDraft((previous) => ({ ...previous, subject: event.target.value }))}
            />

            <Textarea
              label="Body"
              rows={10}
              value={templateDraft.body}
              onChange={(event) => setTemplateDraft((previous) => ({ ...previous, body: event.target.value }))}
            />

            <div className="flex justify-end">
              <Button onClick={saveTemplate} isLoading={updateTemplateMutation.isPending}>
                Save Template
              </Button>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default Settings;
