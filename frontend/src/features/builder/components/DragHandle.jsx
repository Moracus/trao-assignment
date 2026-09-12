import DragIndicatorOutlinedIcon from "@mui/icons-material/DragIndicatorOutlined";

export default function DragHandle(props) {
  return (
    <button
      type="button"
      aria-label="Drag to reorder"
      className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
      {...props}
    >
      <DragIndicatorOutlinedIcon fontSize="small" />
    </button>
  );
}
