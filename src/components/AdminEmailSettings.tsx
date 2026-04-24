import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Mail, Eye, RotateCcw, Save, Loader2, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { getAppSetting, setAppSetting } from '@/lib/appSettings'
import { toast } from 'sonner'

interface TemplateConfig {
  key: string
  title: string
  description: string
  subjectDefault: string
  variables: string[]
}

const TEMPLATES: TemplateConfig[] = [
  {
    key: 'welcome',
    title: 'Email de Boas-Vindas',
    description: 'Enviado ao usuario quando sua conta e criada pelo admin.',
    subjectDefault: 'Bem-vindo ao O que Fazer no Uruguai!',
    variables: ['nome', 'email'],
  },
  {
    key: 'expiration',
    title: 'Fim do Periodo de Utilizacao',
    description: 'Enviado quando o periodo de 20 dias do usuario expira.',
    subjectDefault: 'Seu periodo de acesso expirou',
    variables: ['nome', 'email', 'data_expiracao'],
  },
  {
    key: 'contact',
    title: 'Contato da Empresa',
    description: 'Enviado quando uma empresa envia mensagem pelo painel.',
    subjectDefault: 'Contato do Parceiro - {{assunto}}',
    variables: ['empresa', 'nome', 'email', 'assunto', 'mensagem'],
  },
  {
    key: 'deletion',
    title: 'Solicitacao de Exclusao',
    description: 'Enviado ao admin quando empresa solicita exclusao de conta.',
    subjectDefault: 'Solicitacao de Exclusao de Conta - {{empresa}}',
    variables: ['empresa', 'nome', 'email'],
  },
]

function TemplateEditor({ config }: { config: TemplateConfig }) {
  const [subject, setSubject] = useState('')
  const [html, setHtml] = useState('')
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    getAppSetting(`email_subject_${config.key}`).then((v) => {
      if (v) setSubject(v)
    })
    getAppSetting(`email_template_${config.key}`).then((v) => {
      if (v) setHtml(v)
    })
  }, [config.key])

  const handleSave = async () => {
    setSaving(true)
    const s1 = await setAppSetting(`email_subject_${config.key}`, subject)
    const s2 = html ? await setAppSetting(`email_template_${config.key}`, html) : true
    setSaving(false)
    if (s1 && s2) {
      toast.success(`Template "${config.title}" salvo!`)
    } else {
      toast.error('Erro ao salvar template.')
    }
  }

  const handleReset = async () => {
    setSubject('')
    setHtml('')
    await setAppSetting(`email_subject_${config.key}`, '')
    await setAppSetting(`email_template_${config.key}`, '')
    toast.success('Template resetado para o padrao.')
  }

  const sampleVars: Record<string, string> = {
    nome: 'Maria Silva',
    email: 'maria@email.com',
    empresa: 'Restaurante Exemplo',
    assunto: 'Duvidas',
    mensagem: 'Gostaria de saber mais sobre o aplicativo.',
    data_expiracao: new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
  }

  const previewHtml = html
    ? html.replace(/\{\{(\w+)\}\}/g, (_, k) => sampleVars[k] ?? '')
    : `<div style="padding:40px;text-align:center;color:#64748b;font-family:sans-serif"><p>Nenhum template personalizado configurado.</p><p>O template padrao do sistema sera utilizado.</p></div>`

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
      >
        <div>
          <h3 className="font-bold text-slate-800 text-sm">{config.title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{config.description}</p>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="p-4 pt-0 space-y-4 border-t border-slate-100">
          <div className="flex flex-wrap gap-1.5 mt-3">
            {config.variables.map((v) => (
              <span
                key={v}
                className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-mono"
              >
                {`{{${v}}}`}
              </span>
            ))}
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 text-xs font-bold">Assunto do Email</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={config.subjectDefault}
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 text-xs font-bold">HTML do Email (opcional)</Label>
            <Textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              placeholder="Cole o HTML personalizado aqui... Deixe vazio para usar o template padrao."
              className="min-h-[120px] font-mono text-xs resize-y"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave} disabled={saving} size="sm" className="gap-1.5">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Salvar
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Eye className="h-3.5 w-3.5" /> Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>Preview: {config.title}</DialogTitle>
                </DialogHeader>
                <iframe
                  srcDoc={previewHtml}
                  className="w-full min-h-[400px] border rounded-lg"
                  sandbox=""
                  title="Email preview"
                />
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 text-slate-500">
              <RotateCcw className="h-3.5 w-3.5" /> Resetar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function AdminEmailSettings() {
  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-2 font-display text-xl font-bold text-slate-900 flex items-center gap-2">
        <Mail className="h-5 w-5 text-blue-600" /> Configuracoes de Email
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Personalize o conteudo dos emails enviados pelo sistema. Deixe vazio para usar o template padrao.
      </p>

      <div className="space-y-3">
        {TEMPLATES.map((t) => (
          <TemplateEditor key={t.key} config={t} />
        ))}
      </div>

      <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
        <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">
          <strong>Esqueci a Senha:</strong> O email de redefinicao de senha e enviado pelo Supabase Auth.
          Para personalizar, acesse o{' '}
          <a
            href="https://supabase.com/dashboard/project/ppdceyhtmmwtzrmuidxy/auth/templates"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-bold"
          >
            Supabase Dashboard → Authentication → Email Templates
          </a>
          .
        </p>
      </div>
    </div>
  )
}
