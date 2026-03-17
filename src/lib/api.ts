import { NextResponse } from 'next/server';

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'BUSINESS_ERROR'
  | 'PREDICTION_LOCKED'
  | 'INTERNAL_ERROR'
  | 'EXTERNAL_PROVIDER_ERROR'
  | 'UNKNOWN_ERROR';

export function apiError(code: ApiErrorCode, message: string, status: number, details?: unknown) {
  return NextResponse.json({ ok: false, error: { code, message, details } }, { status });
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}
