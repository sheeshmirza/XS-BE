const sendSuccess = (res: any, statusCode: any, message: any, data: any = null, meta: any = null) => { const payload: any = { success: true, message };
  if (data !== null) payload.data = data;
  if (meta !== null) payload.meta = meta;
  return res.status(statusCode).json(payload); };
export { sendSuccess };
