import { Lock, Mail, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export function AccessExpired() {
  return (
    <div className="flex h-full min-h-[80vh] flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 shadow-inner">
        <Lock className="h-12 w-12 text-slate-400" />
      </div>
      <h1 className="mb-3 font-display text-3xl font-bold text-slate-900">
        Fim do período de utilização
      </h1>
      <p className="mb-8 max-w-md text-slate-500 font-medium">
        Seu acesso de 20 dias aos nossos guias e cupons expirou. Esperamos que você tenha
        aproveitado muito sua viagem pelo Uruguai!
      </p>

      <div className="mb-8 rounded-2xl bg-primary/5 border border-primary/20 p-6 max-w-md text-left">
        <Mail className="h-8 w-8 text-primary mb-3" />
        <h3 className="font-bold text-slate-900 mb-2">Resumo da Viagem Enviado</h3>
        <p className="text-sm text-slate-600">
          Enviamos um e-mail automático com o resumo de todos os locais que você visitou e fez
          check-in. Guarde essa lembrança e não esqueça de nos recomendar para seus amigos!
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button asChild size="lg" className="rounded-xl font-bold h-12 shadow-md">
          <Link to="/profile">Ver Meu Progresso</Link>
        </Button>
        <Button variant="outline" asChild size="lg" className="rounded-xl h-12 font-semibold">
          <a href="https://brasileirosnouruguai.com.br" target="_blank" rel="noopener noreferrer">
            Visitar nosso site <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  )
}
