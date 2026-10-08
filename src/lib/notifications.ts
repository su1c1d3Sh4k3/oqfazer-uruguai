/**
 * Exibe uma notificação do sistema de forma segura.
 *
 * Em navegadores mobile (Chrome Android, navegadores embutidos em apps) o construtor
 * `new Notification()` é proibido e lança TypeError — lá só funciona
 * `ServiceWorkerRegistration.showNotification()`. Esta função nunca lança erro:
 * qualquer falha vira, no máximo, um console.warn. Retorna se a notificação foi exibida.
 */
export async function showNotification(title: string, options?: NotificationOptions): Promise<boolean> {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return false

    // getRegistration() em vez de serviceWorker.ready: o .ready nunca resolve sem SW registrado
    const registration = await navigator.serviceWorker?.getRegistration().catch(() => undefined)
    if (registration) {
      await registration.showNotification(title, options)
      return true
    }

    new Notification(title, options)
    return true
  } catch (error) {
    console.warn('Não foi possível exibir a notificação:', error)
    return false
  }
}
