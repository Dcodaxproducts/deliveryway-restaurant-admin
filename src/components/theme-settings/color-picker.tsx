interface ColorPickerProps {
    label: string;
    description?: string;
    color: string;
}

export default function ColorPicker({ label, description, color }: ColorPickerProps) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <h4 className="text-base text-dark">{label}</h4>
                {description && <p className="text-sm text-gray">{description}</p>}
            </div>
            <div className="flex items-center gap-2">
                <input type="text" value={color} readOnly className="w-20 text-sm text-gray outline-none p-2 border rounded-md" />
                <div className="w-8 h-8 rounded border border-gray-300" style={{ backgroundColor: color }}></div>
            </div>
        </div>
    );
}
