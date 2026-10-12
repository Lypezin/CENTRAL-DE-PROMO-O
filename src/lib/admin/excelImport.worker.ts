import { processExcelBuffer, type ParseProgress, type ParseResult } from './excelParser'

interface ParseRequest {
  type: 'parse'
  jobId: string
  promocaoId: string
  file: ArrayBuffer
}

type WorkerResponse =
  | { type: 'progress'; jobId: string; progress: ParseProgress }
  | { type: 'result'; jobId: string; result: ParseResult }
  | { type: 'error'; jobId: string; error: string }

type WorkerScope = {
  onmessage: ((event: MessageEvent<ParseRequest>) => void) | null
  postMessage: (message: WorkerResponse) => void
}

const workerScope = self as unknown as WorkerScope

workerScope.onmessage = async (event) => {
  const request = event.data
  if (!request || request.type !== 'parse') return

  try {
    const result = await processExcelBuffer(
      request.file,
      request.promocaoId,
      (progress) => workerScope.postMessage({ type: 'progress', jobId: request.jobId, progress }),
    )
    workerScope.postMessage({ type: 'result', jobId: request.jobId, result })
  } catch (error) {
    workerScope.postMessage({
      type: 'error',
      jobId: request.jobId,
      error: error instanceof Error ? error.message : 'Não foi possível validar a planilha.',
    })
  }
}

export {}
