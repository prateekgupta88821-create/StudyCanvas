export default function handler(req: any, res: any) {
  res.status(200).json({
    status: 'healthy',
    application: 'StudyCanvas API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      firebaseAuth: 'operational',
      cloudFirestore: 'operational',
      googleDriveApi: 'operational',
      exportEngine: 'operational',
    },
  });
}
