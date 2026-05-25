import { Image as ImageIcon } from 'lucide-react';
import FileUploader from './file-uploader';

const BrandAssetsSection = () => {
    return (
        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm space-y-6">
            <div className="flex items-center gap-3">
                <ImageIcon className="text-gray-500" />
                <h3 className="text-[20px] font-semibold text-dark">Brand Assets</h3>
            </div>
            <FileUploader 
                title="Restaurant Logo"
                recommendation="Recommended: 400x120px, PNG or SVG with transparent background"
                fileTypes=".png, .svg, .jpg"
            />
            <FileUploader 
                title="Favicon"
                recommendation="Recommended: 32x32px or 64x64px, PNG or ICO"
                fileTypes=".png, .ico"
            />
            <FileUploader 
                title="Hero Banner"
                recommendation="Recommended: 1920x600px, JPG or PNG"
                fileTypes=".png, .jpg"
            />
        </div>
    );
};

export default BrandAssetsSection;
