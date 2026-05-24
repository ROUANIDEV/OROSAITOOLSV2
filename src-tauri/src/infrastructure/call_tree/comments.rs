pub fn strip_comments_preserve_layout(content: &str) -> String {
    let bytes = content.as_bytes();
    let mut result = Vec::with_capacity(bytes.len());
    let mut index = 0usize;

    while index < bytes.len() {
        let current = bytes[index];
        let next = bytes.get(index + 1).copied();

        if current == b'/' && next == Some(b'/') {
            index = strip_line_comment(bytes, index, &mut result);
            continue;
        }

        if current == b'/' && next == Some(b'*') {
            index = strip_block_comment(bytes, index, &mut result);
            continue;
        }

        result.push(current);
        index += 1;
    }

    String::from_utf8_lossy(&result).to_string()
}

fn strip_line_comment(
    bytes: &[u8],
    mut index: usize,
    result: &mut Vec<u8>,
) -> usize {
    result.push(b' ');
    result.push(b' ');
    index += 2;

    while index < bytes.len() && bytes[index] != b'\n' {
        result.push(b' ');
        index += 1;
    }

    if index < bytes.len() {
        result.push(bytes[index]);
        index += 1;
    }

    index
}

fn strip_block_comment(
    bytes: &[u8],
    mut index: usize,
    result: &mut Vec<u8>,
) -> usize {
    result.push(b' ');
    result.push(b' ');
    index += 2;

    while index + 1 < bytes.len() {
        if bytes[index] == b'*' && bytes[index + 1] == b'/' {
            result.push(b' ');
            result.push(b' ');
            return index + 2;
        }

        push_layout_preserving_byte(bytes[index], result);
        index += 1;
    }

    index
}

fn push_layout_preserving_byte(byte: u8, result: &mut Vec<u8>) {
    if byte == b'\n' {
        result.push(b'\n');
    } else {
        result.push(b' ');
    }
}