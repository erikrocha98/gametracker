def parse_external_id(api_id: str) -> tuple[str, str]:
    parts = api_id.split("-", 1)
    if len(parts) != 2 or not parts[0] or not parts[1]:
        raise ValueError(f"Invalid game id format: {api_id!r}")
    return parts[0], parts[1]
