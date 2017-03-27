function stripPrefix(str, prefix)
{
    if (str.lastIndexOf(prefix, 0) === 0) {
        return str.substr(prefix.length);
    } else {
        return null;
    }
}