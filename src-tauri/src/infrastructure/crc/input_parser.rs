use crate::domain::crc::CrcCalculationRequest;

pub fn parse_payload(request: &CrcCalculationRequest) -> Result<Vec<u8>, String> {
    match request.input_format.trim().to_lowercase().as_str() {
        "text" | "ascii" | "utf8" | "utf-8" => Ok(request.payload.as_bytes().to_vec()),
        "hex" => parse_hex_payload(&request.payload),
        other => Err(format!(
            "Unsupported CRC input format '{other}'. Use 'text' or 'hex'."
        )),
    }
}

fn parse_hex_payload(payload: &str) -> Result<Vec<u8>, String> {
    let normalized = normalize_hex_payload(payload);

    if normalized.is_empty() {
        return Ok(Vec::new());
    }

    if normalized.len() % 2 != 0 {
        return Err(
            "Hex payload must contain an even number of hexadecimal digits."
                .to_string(),
        );
    }

    let mut bytes = Vec::with_capacity(normalized.len() / 2);

    for index in (0..normalized.len()).step_by(2) {
        let chunk = &normalized[index..index + 2];

        let byte = u8::from_str_radix(chunk, 16).map_err(|error| {
            format!("Invalid hex byte '{chunk}' in CRC payload: {error}")
        })?;

        bytes.push(byte);
    }

    Ok(bytes)
}

fn normalize_hex_payload(payload: &str) -> String {
    payload
        .chars()
        .filter(|character| !character.is_whitespace())
        .filter(|character| *character != '_' && *character != '-')
        .collect()
}