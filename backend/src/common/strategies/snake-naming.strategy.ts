import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';
import { snakeCase } from 'typeorm/util/StringUtils.js';

export class SnakeNamingStrategy
    extends DefaultNamingStrategy
    implements NamingStrategyInterface
{
    tableName(targetName: string, userSpecifiedName?: string): string {
        return userSpecifiedName ?? snakeCase(targetName);
    }

    columnName(
        propertyName: string,
        customName: string | undefined,
        embeddedPrefixes: string[],
    ): string {
        return snakeCase(
            embeddedPrefixes.concat(customName ?? propertyName).join('_'),
        );
    }

    relationName(propertyName: string): string {
        return snakeCase(propertyName);
    }

    joinColumnName(relationName: string, referencedColumnName: string): string {
        return snakeCase(`${relationName}_${referencedColumnName}`);
    }

    joinTableName(
        firstTableName: string,
        secondTableName: string,
        firstPropertyName: string,
    ): string {
        return snakeCase(
            `${firstTableName}_${firstPropertyName.replace(/\./gi, '_')}_${secondTableName}`,
        );
    }

    joinTableColumnName(
        tableName: string,
        propertyName: string,
        columnName?: string,
    ): string {
        return snakeCase(`${tableName}_${columnName ?? propertyName}`);
    }
}
