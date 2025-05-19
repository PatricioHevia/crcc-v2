export function removeAccents(str: string): string {
    const accents = 'ÀÁÂÃÄÅàáâãäåÒÓÔÕÖØòóôõöøÈÉÊËèéêëÇçìíîïÌÍÎÏùúûüÙÚÛÜÿÑñ';
    const regular = 'AAAAAAaaaaaaOOOOOOooooooEEEEeeeeCciiiiIIIIuuuuUUUUyNn';
    const map = new Map<string, string>();



    for (let i = 0; i < accents.length; i++) {
        map.set(accents[i], regular[i]);
    }

    return str
        .split('')
        .map((char) => map.get(char) || char)
        .join('');
}