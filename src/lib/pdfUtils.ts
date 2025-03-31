import { supabase, SupabaseUser } from './supabase'; // Fix import to use SupabaseUser
import jsPDF from 'jspdf';

interface PDFContent {
  title: string;
  type: 'lesson' | 'recap' | 'flashcards' | 'reminder'; // Add 'reminder'
  content: string;
  metadata?: {
    date?: string;
    topic?: string;
    difficulty?: string;
    timeSpent?: string;
    testDate?: string; // Add testDate for the next error
  };
}

export async function generateAndSavePDF(
  userId: string,
  content: PDFContent
): Promise<string> {
  try {
    // Generate PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const lineHeight = 7;

    // Add title
    doc.setFontSize(20);
    doc.text(content.title, margin, margin + lineHeight);
    doc.setFontSize(12);

    // Add metadata if available
    let yPos = margin + lineHeight * 3;
    if (content.metadata) {
      Object.entries(content.metadata).forEach(([key, value]) => {
        doc.text(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`, margin, yPos);
        yPos += lineHeight * 1.5;
      });
    }

    // Add content
    yPos += lineHeight;
    const splitContent = doc.splitTextToSize(content.content, pageWidth - margin * 2);
    doc.text(splitContent, margin, yPos);

    // Save to Supabase Storage
    const pdfBlob = doc.output('blob');
    const fileName = `${content.type}-${Date.now()}.pdf`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('pdfs')
      .upload(filePath, pdfBlob, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('pdfs')
      .getPublicUrl(filePath);

    // Save to history table
    const { error: dbError } = await supabase
      .from('history')
      .insert([{
        user_id: userId,
        type: content.type,
        title: content.title,
        content: content.content,
        pdf_url: publicUrl,
        created_at: new Date().toISOString()
      }]);

    if (dbError) throw dbError;

    return publicUrl;
  } catch (error) {
    console.error('Error generating and saving PDF:', error);
    throw error;
  }
}

export async function cleanupExpiredPDFs(userId: string, daysToKeep: number = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // Get expired items
    const { data: expiredItems, error: fetchError } = await supabase
      .from('history')
      .select('id, pdf_url')
      .eq('user_id', userId)
      .lt('created_at', cutoffDate.toISOString());

    if (fetchError) throw fetchError;

    // Delete expired items
    for (const item of expiredItems || []) {
      // Delete from storage
      if (item.pdf_url) {
        const filePath = item.pdf_url.split('/').slice(-2).join('/');
        await supabase.storage
          .from('pdfs')
          .remove([filePath]);
      }

      // Delete from database
      await supabase
        .from('history')
        .delete()
        .eq('id', item.id);
    }
  } catch (error) {
    console.error('Error cleaning up expired PDFs:', error);
    throw error;
  }
}

export async function clearUserHistory(userId: string) {
  try {
    // Get all user's history items
    const { data: items, error: fetchError } = await supabase
      .from('history')
      .select('id, pdf_url')
      .eq('user_id', userId);

    if (fetchError) throw fetchError;

    // Delete all PDFs from storage
    for (const item of items || []) {
      if (item.pdf_url) {
        const filePath = item.pdf_url.split('/').slice(-2).join('/');
        await supabase.storage
          .from('pdfs')
          .remove([filePath]);
      }
    }

    // Delete all history records
    const { error: deleteError } = await supabase
      .from('history')
      .delete()
      .eq('user_id', userId);

    if (deleteError) throw deleteError;
  } catch (error) {
    console.error('Error clearing user history:', error);
    throw error;
  }
}