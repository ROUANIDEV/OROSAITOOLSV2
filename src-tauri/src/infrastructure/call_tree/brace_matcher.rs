pub fn find_matching_brace(
    content: &str,
    open_brace_index: usize,
) -> Option<usize> {
    let bytes = content.as_bytes();

    if bytes.get(open_brace_index) != Some(&b'{') {
        return None;
    }

    let mut depth = 0usize;

    for (index, byte) in bytes.iter().enumerate().skip(open_brace_index) {
        match byte {
            b'{' => depth += 1,
            b'}' => {
                depth = depth.saturating_sub(1);

                if depth == 0 {
                    return Some(index);
                }
            }
            _ => {}
        }
    }

    None
}