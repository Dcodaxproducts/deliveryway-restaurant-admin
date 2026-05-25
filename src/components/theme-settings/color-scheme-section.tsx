import { Palette } from 'lucide-react';
import ColorPicker from './color-picker';

const ColorSchemeSection = () => {
    return (
        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm space-y-6">
            <div className="flex items-center gap-3">
                <Palette className="text-gray-500" />
                <h3 className="text-[20px] font-semibold text-dark">Color Scheme</h3>
            </div>
            <ColorPicker 
                label="Primary Brand Color"
                description="Main brand color used throughout the site"
                color="#00FF7B"
            />
            <ColorPicker 
                label="Secondary Color"
                description="Used for headings and accents"
                color="#030401"
            />
            <ColorPicker 
                label="Accent Color"
                description="Highlights, badges, and special elements"
                color="#F59E0B"
            />
            <ColorPicker 
                label="Background Color"
                color="#FFFFFF"
            />
            <ColorPicker 
                label="Text Color"
                color="#030401"
            />
            <ColorPicker 
                label="Button Color"
                color="#CE181B"
            />
        </div>
    );
};

export default ColorSchemeSection;
