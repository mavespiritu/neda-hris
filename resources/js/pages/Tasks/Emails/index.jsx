import { Head } from '@inertiajs/react'

const formatDateTime = (value) => {
  if (!value) return '-'
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return value
  }
}

export default function Emails({ messages = [], needsMicrosoftConnect = false, connectUrl, error = null }) {
  return (
    <>
      <Head title='Outlook Inbox' />

      <div className='mx-auto w-full max-w-6xl space-y-4'>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <h1 className='text-2xl font-semibold text-slate-900'>Outlook Inbox</h1>
          <a
            href={connectUrl}
            className='inline-flex h-10 items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-medium text-white hover:bg-blue-600'
          >
            {needsMicrosoftConnect ? 'Connect Microsoft Account' : 'Reconnect Microsoft'}
          </a>
        </div>

        {error && (
          <div className='rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>
            {error}
          </div>
        )}

        {needsMicrosoftConnect ? (
          <div className='rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-600'>
            Connect your Microsoft account to load your Outlook emails in this page.
          </div>
        ) : (
          <div className='overflow-hidden rounded-md border border-slate-200 bg-white'>
            <table className='min-w-full divide-y divide-slate-200'>
              <thead className='bg-slate-50'>
                <tr>
                  <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500'>Subject</th>
                  <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500'>From</th>
                  <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500'>Received</th>
                  <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500'>Preview</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-100'>
                {messages.length === 0 ? (
                  <tr>
                    <td className='px-4 py-6 text-sm text-slate-500' colSpan={4}>
                      No messages found.
                    </td>
                  </tr>
                ) : (
                  messages.map((message) => (
                    <tr key={message.id} className={message.isRead ? 'bg-white' : 'bg-blue-50/40'}>
                      <td className='px-4 py-3 text-sm text-slate-800'>
                        {message.webLink ? (
                          <a href={message.webLink} target='_blank' rel='noreferrer' className='font-medium hover:underline'>
                            {message.subject}
                          </a>
                        ) : (
                          <span className='font-medium'>{message.subject}</span>
                        )}
                      </td>
                      <td className='px-4 py-3 text-sm text-slate-700'>
                        {message.senderName || message.from || '-'}
                      </td>
                      <td className='px-4 py-3 text-sm text-slate-600'>{formatDateTime(message.receivedAt)}</td>
                      <td className='px-4 py-3 text-sm text-slate-600'>{message.preview || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
