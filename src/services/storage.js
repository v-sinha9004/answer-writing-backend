import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase URL or Service Role Key is missing in environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Uploads a PDF file to Supabase Storage.
 * @param {Object} file - Multer file object
 * @returns {Promise<{ path: string, url: string }>} - Supabase storage path and public URL
 */
export const uploadPdfToSupabase = async (file) => {
  try {
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${timestamp}-${originalName}`;
    const bucketName = 'answer-writing-pdf';

    const fileStream = fs.createReadStream(file.path);
    
    // We must pass the correct mime type, otherwise supabase guesses from extension or defaults to application/octet-stream
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fs.readFileSync(file.path), {
        contentType: 'application/pdf',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Failed to upload to Supabase: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    return {
      path: data.path,
      url: publicUrlData.publicUrl
    };
  } catch (error) {
    console.error('Error in uploadPdfToSupabase:', error);
    throw new Error('Failed to upload file to storage');
  } finally {
    // Clean up temporary file from multer
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  }
};
